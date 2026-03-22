import { eq, sql, gte, and } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { extractedLeads, emailLogs, callLogs, leads } from '../../db/schema/index.js';

export class CrmDashboardService {
  async getSummary(userId?: number) {
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const callConditions = [eq(callLogs.callDate, today)];
    if (userId) callConditions.push(eq(callLogs.callerUserId, userId));

    const [
      extractedNew,
      extractedToday,
      emailsSentToday,
      callsMadeToday,
      leadPipeline,
      pendingFollowUps,
    ] = await Promise.all([
      // New extracted leads pending review
      db.select({ count: sql<number>`count(*)::int` })
        .from(extractedLeads)
        .where(eq(extractedLeads.status, 'new')),

      // Extracted today
      db.select({ count: sql<number>`count(*)::int` })
        .from(extractedLeads)
        .where(eq(extractedLeads.extractionDate, today)),

      // Emails sent today
      db.select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(and(eq(emailLogs.status, 'sent'), gte(emailLogs.sentAt, todayStart))),

      // Calls made today
      db.select({ count: sql<number>`count(*)::int` })
        .from(callLogs)
        .where(and(...callConditions)),

      // Lead pipeline
      db.select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
      }).from(leads).groupBy(leads.status),

      // Pending follow-ups
      db.select({ count: sql<number>`count(*)::int` })
        .from(callLogs)
        .where(and(
          sql`${callLogs.followUpDate} <= ${today}`,
          eq(callLogs.followUpCompleted, false),
        )),
    ]);

    return {
      extractedLeadsPending: extractedNew[0]?.count ?? 0,
      extractedToday: extractedToday[0]?.count ?? 0,
      emailsSentToday: emailsSentToday[0]?.count ?? 0,
      emailDailyLimit: 20,
      callsMadeToday: callsMadeToday[0]?.count ?? 0,
      callDailyTarget: 20,
      leadPipeline,
      pendingFollowUps: pendingFollowUps[0]?.count ?? 0,
    };
  }
}
