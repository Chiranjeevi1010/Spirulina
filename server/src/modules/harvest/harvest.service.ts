import { eq, and, sql, desc, gte, lte, between } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { harvests, ponds } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class HarvestService {
  async list(page: number, limit: number, filters?: { pondId?: number; startDate?: string; endDate?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.pondId) conditions.push(eq(harvests.pondId, filters.pondId));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(harvests.harvestDate, filters.startDate, filters.endDate));
    } else if (filters?.startDate) {
      conditions.push(gte(harvests.harvestDate, filters.startDate));
    } else if (filters?.endDate) {
      conditions.push(lte(harvests.harvestDate, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: harvests.id,
        pondId: harvests.pondId,
        pondName: ponds.name,
        pondCode: ponds.code,
        harvestDate: harvests.harvestDate,
        wetHarvestKg: harvests.wetHarvestKg,
        solidsPercentage: harvests.solidsPercentage,
        dryYieldPercentage: harvests.dryYieldPercentage,
        harvestMethod: harvests.harvestMethod,
        notes: harvests.notes,
        recordedBy: harvests.recordedBy,
        createdAt: harvests.createdAt,
        updatedAt: harvests.updatedAt,
      })
        .from(harvests)
        .leftJoin(ponds, eq(harvests.pondId, ponds.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(harvests.harvestDate)),
      db.select({ count: sql<number>`count(*)::int` }).from(harvests).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [harvest] = await db
      .select({
        id: harvests.id,
        pondId: harvests.pondId,
        pondName: ponds.name,
        harvestDate: harvests.harvestDate,
        wetHarvestKg: harvests.wetHarvestKg,
        solidsPercentage: harvests.solidsPercentage,
        dryYieldPercentage: harvests.dryYieldPercentage,
        harvestMethod: harvests.harvestMethod,
        notes: harvests.notes,
        recordedBy: harvests.recordedBy,
        createdAt: harvests.createdAt,
        updatedAt: harvests.updatedAt,
      })
      .from(harvests)
      .leftJoin(ponds, eq(harvests.pondId, ponds.id))
      .where(eq(harvests.id, id))
      .limit(1);

    if (!harvest) throw new AppError('Harvest record not found', 404);
    return harvest;
  }

  async create(data: {
    pondId: number;
    harvestDate: string;
    wetHarvestKg: number;
    solidsPercentage?: number;
    dryYieldPercentage?: number;
    harvestMethod?: string;
    notes?: string;
  }, userId?: number) {
    // Verify pond exists
    const [pond] = await db.select({ id: ponds.id }).from(ponds).where(eq(ponds.id, data.pondId)).limit(1);
    if (!pond) throw new AppError('Pond not found', 404);

    const [harvest] = await db.insert(harvests).values({
      pondId: data.pondId,
      harvestDate: data.harvestDate,
      wetHarvestKg: String(data.wetHarvestKg),
      solidsPercentage: data.solidsPercentage ? String(data.solidsPercentage) : undefined,
      dryYieldPercentage: data.dryYieldPercentage ? String(data.dryYieldPercentage) : undefined,
      harvestMethod: data.harvestMethod || 'filtration',
      notes: data.notes,
      recordedBy: userId,
    }).returning();

    return harvest;
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: harvests.id }).from(harvests).where(eq(harvests.id, id)).limit(1);
    if (!existing) throw new AppError('Harvest record not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.pondId !== undefined) updateData.pondId = data.pondId;
    if (data.harvestDate !== undefined) updateData.harvestDate = data.harvestDate;
    if (data.wetHarvestKg !== undefined) updateData.wetHarvestKg = String(data.wetHarvestKg);
    if (data.solidsPercentage !== undefined) updateData.solidsPercentage = String(data.solidsPercentage);
    if (data.dryYieldPercentage !== undefined) updateData.dryYieldPercentage = String(data.dryYieldPercentage);
    if (data.harvestMethod !== undefined) updateData.harvestMethod = data.harvestMethod;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [harvest] = await db.update(harvests).set(updateData).where(eq(harvests.id, id)).returning();
    return harvest;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: harvests.id }).from(harvests).where(eq(harvests.id, id)).limit(1);
    if (!existing) throw new AppError('Harvest record not found', 404);
    await db.delete(harvests).where(eq(harvests.id, id));
  }

  async getByPond(pondId: number, limit = 10) {
    return db.select().from(harvests).where(eq(harvests.pondId, pondId)).orderBy(desc(harvests.harvestDate)).limit(limit);
  }

  async getStats(startDate?: string, endDate?: string) {
    const conditions = [];
    if (startDate) conditions.push(gte(harvests.harvestDate, startDate));
    if (endDate) conditions.push(lte(harvests.harvestDate, endDate));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        totalWetHarvestKg: sql<number>`coalesce(sum(${harvests.wetHarvestKg}::numeric), 0)`,
        harvestCount: sql<number>`count(*)::int`,
        avgWetPerHarvest: sql<number>`coalesce(avg(${harvests.wetHarvestKg}::numeric), 0)`,
      })
      .from(harvests)
      .where(whereClause);

    return stats;
  }
}
