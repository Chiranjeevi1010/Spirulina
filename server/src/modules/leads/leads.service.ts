import { eq, and, sql, desc, like, or, notInArray } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { leads, customers } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class LeadsService {
  async list(page: number, limit: number, filters?: { status?: string; assignedTo?: number; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.status) conditions.push(eq(leads.status, filters.status));
    if (filters?.assignedTo) conditions.push(eq(leads.assignedTo, filters.assignedTo));
    if (filters?.search) {
      conditions.push(
        or(
          like(leads.contactName, `%${filters.search}%`),
          like(leads.companyName, `%${filters.search}%`),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(leads).where(whereClause).limit(limit).offset(offset).orderBy(desc(leads.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(leads).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async create(data: {
    contactName: string;
    companyName?: string;
    email?: string;
    phone?: string;
    leadSource?: string;
    customerType?: string;
    status?: string;
    estimatedValue?: number;
    nextFollowUp?: string;
    notes?: string;
    assignedTo?: number;
  }, userId?: number) {
    const [lead] = await db.insert(leads).values({
      contactName: data.contactName,
      companyName: data.companyName,
      email: data.email,
      phone: data.phone,
      leadSource: data.leadSource,
      customerType: data.customerType,
      status: data.status || 'new',
      estimatedValue: data.estimatedValue ? String(data.estimatedValue) : undefined,
      nextFollowUp: data.nextFollowUp,
      notes: data.notes,
      assignedTo: data.assignedTo,
      createdBy: userId,
    }).returning();

    return lead;
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
    if (!existing) throw new AppError('Lead not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const stringFields = ['contactName', 'companyName', 'email', 'phone', 'leadSource', 'customerType', 'status', 'nextFollowUp', 'notes'];
    for (const f of stringFields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.estimatedValue !== undefined) updateData.estimatedValue = String(data.estimatedValue);
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;

    const [lead] = await db.update(leads).set(updateData).where(eq(leads.id, id)).returning();
    return lead;
  }

  async updateStatus(id: number, status: string) {
    const [lead] = await db.update(leads).set({
      status,
      updatedAt: new Date(),
    }).where(eq(leads.id, id)).returning();
    if (!lead) throw new AppError('Lead not found', 404);
    return lead;
  }

  async convertToCustomer(id: number) {
    const lead = await this.getById(id);
    if (lead.convertedToCustomerId) throw new AppError('Lead already converted', 400);

    // Create customer from lead data
    const [customer] = await db.insert(customers).values({
      contactName: lead.contactName,
      companyName: lead.companyName,
      email: lead.email,
      phone: lead.phone,
      customerType: lead.customerType || 'direct',
      createdBy: lead.createdBy,
    }).returning();

    // Update lead
    await db.update(leads).set({
      status: 'won',
      convertedToCustomerId: customer.id,
      updatedAt: new Date(),
    }).where(eq(leads.id, id));

    return customer;
  }

  async getByStatus() {
    const pipeline = await db
      .select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
        totalValue: sql<number>`coalesce(sum(${leads.estimatedValue}::numeric), 0)`,
      })
      .from(leads)
      .groupBy(leads.status)
      .orderBy(leads.status);

    return pipeline;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
    if (!existing) throw new AppError('Lead not found', 404);
    await db.delete(leads).where(eq(leads.id, id));
  }
}
