import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { emailLogs, emailTemplates, leads, customers, settings } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import { EmailClient } from './email.client.js';

export class EmailService {
  private client = new EmailClient();

  // --- Config ---
  async getConfig() {
    return this.client.getConfig();
  }

  async updateConfig(data: Record<string, unknown>, userId: number) {
    for (const [key, value] of Object.entries(data)) {
      await db
        .insert(settings)
        .values({
          category: 'email',
          key,
          value: value as Record<string, unknown>,
          updatedBy: userId,
        })
        .onConflictDoUpdate({
          target: [settings.category, settings.key],
          set: { value: value as Record<string, unknown>, updatedBy: userId, updatedAt: new Date() },
        });
    }
  }

  async testConnection() {
    return this.client.testConnection();
  }

  // --- Daily Limit ---
  async getDailySentCount(): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailLogs)
      .where(and(eq(emailLogs.status, 'sent'), gte(emailLogs.sentAt, todayStart)));

    return result?.count ?? 0;
  }

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const config = await this.getConfig();

    const [sentToday, failedToday, totalSent] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(and(eq(emailLogs.status, 'sent'), gte(emailLogs.sentAt, todayStart))),
      db.select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(and(eq(emailLogs.status, 'failed'), gte(emailLogs.createdAt, todayStart))),
      db.select({ count: sql<number>`count(*)::int` })
        .from(emailLogs)
        .where(eq(emailLogs.status, 'sent')),
    ]);

    return {
      sentToday: sentToday[0]?.count ?? 0,
      failedToday: failedToday[0]?.count ?? 0,
      dailyLimit: config.daily_limit,
      remainingToday: Math.max(0, config.daily_limit - (sentToday[0]?.count ?? 0)),
      totalSent: totalSent[0]?.count ?? 0,
    };
  }

  // --- Send Email ---
  async sendEmail(data: {
    recipientEmail: string;
    recipientName?: string;
    subject?: string;
    body?: string;
    templateId?: number;
    leadId?: number;
    customerId?: number;
  }, userId: number) {
    // Check daily limit
    const config = await this.getConfig();
    const sentToday = await this.getDailySentCount();
    if (sentToday >= config.daily_limit) {
      throw new AppError(`Daily email limit reached (${config.daily_limit}/day)`, 429);
    }

    let subject = data.subject || '';
    let body = data.body || '';

    // Load template if specified
    if (data.templateId) {
      const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, data.templateId)).limit(1);
      if (!template) throw new AppError('Email template not found', 404);

      // Replace placeholders
      const replacements: Record<string, string> = {
        contactName: data.recipientName || 'Sir/Madam',
        companyName: '',
        senderName: 'Spirulina Team',
      };

      if (data.leadId) {
        const [lead] = await db.select().from(leads).where(eq(leads.id, data.leadId)).limit(1);
        if (lead) {
          replacements.contactName = lead.contactName;
          replacements.companyName = lead.companyName || '';
        }
      } else if (data.customerId) {
        const [customer] = await db.select().from(customers).where(eq(customers.id, data.customerId)).limit(1);
        if (customer) {
          replacements.contactName = customer.contactName;
          replacements.companyName = customer.companyName || '';
        }
      }

      subject = data.subject || this.replacePlaceholders(template.subject, replacements);
      body = data.body || this.replacePlaceholders(template.body, replacements);
    }

    if (!subject || !body) {
      throw new AppError('Subject and body are required', 400);
    }

    // Send
    const result = await this.client.sendEmail(data.recipientEmail, subject, body);

    // Log
    const [log] = await db.insert(emailLogs).values({
      leadId: data.leadId,
      customerId: data.customerId,
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      subject,
      body,
      templateId: data.templateId,
      status: result.success ? 'sent' : 'failed',
      sentAt: result.success ? new Date() : null,
      errorMessage: result.error,
      sentBy: userId,
    }).returning();

    return { ...log, messageId: result.messageId };
  }

  async bulkSend(leadIds: number[], templateId: number, userId: number) {
    const config = await this.getConfig();
    const sentToday = await this.getDailySentCount();
    const remaining = Math.max(0, config.daily_limit - sentToday);

    if (remaining === 0) {
      throw new AppError(`Daily email limit reached (${config.daily_limit}/day)`, 429);
    }

    const results = { sent: 0, failed: 0, skippedDueToLimit: 0, skippedNoEmail: 0 };
    const leadsToSend = leadIds.slice(0, remaining);
    results.skippedDueToLimit = leadIds.length - leadsToSend.length;

    for (const leadId of leadsToSend) {
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      if (!lead || !lead.email) {
        results.skippedNoEmail++;
        continue;
      }

      try {
        await this.sendEmail({
          recipientEmail: lead.email,
          recipientName: lead.contactName,
          templateId,
          leadId,
        }, userId);
        results.sent++;
      } catch {
        results.failed++;
      }
    }

    return results;
  }

  // --- Email Log ---
  async getLog(page: number, limit: number, filters?: { status?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.status) conditions.push(eq(emailLogs.status, filters.status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(emailLogs).where(whereClause).limit(limit).offset(offset).orderBy(desc(emailLogs.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(emailLogs).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  // --- Templates ---
  async listTemplates() {
    return db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async getTemplate(id: number) {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
    if (!template) throw new AppError('Template not found', 404);
    return template;
  }

  async createTemplate(data: { templateName: string; subject: string; body: string; category: string }, userId: number) {
    const [template] = await db.insert(emailTemplates).values({
      ...data,
      createdBy: userId,
    }).returning();
    return template;
  }

  async updateTemplate(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
    if (!existing) throw new AppError('Template not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const fields = ['templateName', 'subject', 'body', 'category', 'isActive'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }

    const [template] = await db.update(emailTemplates).set(updateData).where(eq(emailTemplates.id, id)).returning();
    return template;
  }

  async deleteTemplate(id: number) {
    const [existing] = await db.select({ id: emailTemplates.id }).from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
    if (!existing) throw new AppError('Template not found', 404);
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // --- Helpers ---
  private replacePlaceholders(text: string, replacements: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key] || '');
  }
}
