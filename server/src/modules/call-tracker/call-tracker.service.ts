import { eq, and, sql, desc, lte, gte } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { callLogs, leads } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class CallTrackerService {
  async list(page: number, limit: number, filters?: {
    callerUserId?: number;
    leadId?: number;
    customerId?: number;
    outcome?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.callerUserId) conditions.push(eq(callLogs.callerUserId, filters.callerUserId));
    if (filters?.leadId) conditions.push(eq(callLogs.leadId, filters.leadId));
    if (filters?.customerId) conditions.push(eq(callLogs.customerId, filters.customerId));
    if (filters?.outcome) conditions.push(eq(callLogs.outcome, filters.outcome));
    if (filters?.startDate) conditions.push(gte(callLogs.callDate, filters.startDate));
    if (filters?.endDate) conditions.push(lte(callLogs.callDate, filters.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(callLogs).where(whereClause).limit(limit).offset(offset).orderBy(desc(callLogs.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(callLogs).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [log] = await db.select().from(callLogs).where(eq(callLogs.id, id)).limit(1);
    if (!log) throw new AppError('Call log not found', 404);
    return log;
  }

  async create(data: {
    leadId?: number;
    customerId?: number;
    callDate: string;
    callTime?: string;
    duration?: number;
    callType: string;
    outcome: string;
    notes?: string;
    followUpDate?: string;
    followUpNotes?: string;
  }, userId: number) {
    const [log] = await db.insert(callLogs).values({
      leadId: data.leadId,
      customerId: data.customerId,
      callerUserId: userId,
      callDate: data.callDate,
      callTime: data.callTime,
      duration: data.duration,
      callType: data.callType,
      outcome: data.outcome,
      notes: data.notes,
      followUpDate: data.followUpDate,
      followUpNotes: data.followUpNotes,
    }).returning();

    // Update lead's nextFollowUp if set
    if (data.leadId && data.followUpDate) {
      await db.update(leads).set({
        nextFollowUp: data.followUpDate,
        updatedAt: new Date(),
      }).where(eq(leads.id, data.leadId));
    }

    return log;
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: callLogs.id }).from(callLogs).where(eq(callLogs.id, id)).limit(1);
    if (!existing) throw new AppError('Call log not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const fields = ['callDate', 'callTime', 'duration', 'callType', 'outcome', 'notes', 'followUpDate', 'followUpNotes', 'followUpCompleted'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }

    const [log] = await db.update(callLogs).set(updateData).where(eq(callLogs.id, id)).returning();
    return log;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: callLogs.id }).from(callLogs).where(eq(callLogs.id, id)).limit(1);
    if (!existing) throw new AppError('Call log not found', 404);
    await db.delete(callLogs).where(eq(callLogs.id, id));
  }

  async getStats(userId?: number) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todayConditions = [eq(callLogs.callDate, today)];
    const weekConditions = [gte(callLogs.callDate, weekAgo)];
    if (userId) {
      todayConditions.push(eq(callLogs.callerUserId, userId));
      weekConditions.push(eq(callLogs.callerUserId, userId));
    }

    const [callsToday, callsThisWeek, outcomeCounts] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(callLogs)
        .where(and(...todayConditions)),
      db.select({ count: sql<number>`count(*)::int` })
        .from(callLogs)
        .where(and(...weekConditions)),
      db.select({
        outcome: callLogs.outcome,
        count: sql<number>`count(*)::int`,
      }).from(callLogs)
        .where(and(...weekConditions))
        .groupBy(callLogs.outcome),
    ]);

    return {
      callsToday: callsToday[0]?.count ?? 0,
      callsThisWeek: callsThisWeek[0]?.count ?? 0,
      dailyTarget: 20,
      byOutcome: outcomeCounts,
    };
  }

  async getDailyTarget(userId: number) {
    const today = new Date().toISOString().split('T')[0];
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(callLogs)
      .where(and(eq(callLogs.callDate, today), eq(callLogs.callerUserId, userId)));

    return {
      made: result?.count ?? 0,
      target: 20,
      remaining: Math.max(0, 20 - (result?.count ?? 0)),
    };
  }

  async getPendingFollowUps(userId?: number) {
    const today = new Date().toISOString().split('T')[0];
    const conditions = [
      lte(callLogs.followUpDate, today),
      eq(callLogs.followUpCompleted, false),
    ];
    if (userId) conditions.push(eq(callLogs.callerUserId, userId));

    return db.select().from(callLogs)
      .where(and(...conditions))
      .orderBy(callLogs.followUpDate)
      .limit(50);
  }

  async completeFollowUp(id: number) {
    const [log] = await db.update(callLogs).set({
      followUpCompleted: true,
      updatedAt: new Date(),
    }).where(eq(callLogs.id, id)).returning();

    if (!log) throw new AppError('Call log not found', 404);
    return log;
  }

  async getAnalytics(startDate?: string, endDate?: string) {
    const conditions = [];
    if (startDate) conditions.push(gte(callLogs.callDate, startDate));
    if (endDate) conditions.push(lte(callLogs.callDate, endDate));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [callsByDay, byOutcome, avgDuration] = await Promise.all([
      db.select({
        date: callLogs.callDate,
        count: sql<number>`count(*)::int`,
      }).from(callLogs).where(whereClause).groupBy(callLogs.callDate).orderBy(callLogs.callDate).limit(30),

      db.select({
        outcome: callLogs.outcome,
        count: sql<number>`count(*)::int`,
      }).from(callLogs).where(whereClause).groupBy(callLogs.outcome),

      db.select({
        avg: sql<number>`coalesce(round(avg(${callLogs.duration})), 0)::int`,
      }).from(callLogs).where(whereClause),
    ]);

    return {
      callsByDay,
      byOutcome,
      avgDuration: avgDuration[0]?.avg ?? 0,
    };
  }
}
