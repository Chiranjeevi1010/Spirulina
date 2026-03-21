import { eq, and, sql, desc, like, or } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { customers, orders } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class CustomersService {
  async list(page: number, limit: number, filters?: { customerType?: string; isActive?: boolean; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.customerType) conditions.push(eq(customers.customerType, filters.customerType));
    if (filters?.isActive !== undefined) conditions.push(eq(customers.isActive, filters.isActive));
    if (filters?.search) {
      conditions.push(
        or(
          like(customers.contactName, `%${filters.search}%`),
          like(customers.companyName, `%${filters.search}%`),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(customers).where(whereClause).limit(limit).offset(offset).orderBy(desc(customers.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(customers).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  async create(data: {
    companyName?: string;
    contactName: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    customerType: string;
    creditDays?: number;
    creditLimit?: number;
    gstNumber?: string;
    notes?: string;
  }, userId?: number) {
    const [customer] = await db.insert(customers).values({
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country || 'India',
      customerType: data.customerType,
      creditDays: data.creditDays ?? 0,
      creditLimit: data.creditLimit ? String(data.creditLimit) : '0',
      gstNumber: data.gstNumber,
      notes: data.notes,
      createdBy: userId,
    }).returning();

    return customer;
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).limit(1);
    if (!existing) throw new AppError('Customer not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const stringFields = ['companyName', 'contactName', 'email', 'phone', 'address', 'city', 'state', 'country', 'customerType', 'gstNumber', 'notes'];
    for (const f of stringFields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.creditDays !== undefined) updateData.creditDays = data.creditDays;
    if (data.creditLimit !== undefined) updateData.creditLimit = String(data.creditLimit);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [customer] = await db.update(customers).set(updateData).where(eq(customers.id, id)).returning();
    return customer;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).limit(1);
    if (!existing) throw new AppError('Customer not found', 404);
    await db.update(customers).set({ isActive: false, updatedAt: new Date() }).where(eq(customers.id, id));
  }

  async getOrderHistory(customerId: number) {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.orderDate));
  }

  async updateOutstanding(customerId: number, amount: number) {
    const [customer] = await db.update(customers).set({
      outstandingAmount: String(amount),
      updatedAt: new Date(),
    }).where(eq(customers.id, customerId)).returning();
    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }
}
