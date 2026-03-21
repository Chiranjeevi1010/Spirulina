import { eq, and, sql, desc, gte, lte, like, between } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { expenses, expenseCategories, ponds } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class ExpensesService {
  async list(page: number, limit: number, filters?: {
    categoryId?: number; status?: string; pondId?: number;
    startDate?: string; endDate?: string; search?: string;
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.categoryId) conditions.push(eq(expenses.categoryId, filters.categoryId));
    if (filters?.status) conditions.push(eq(expenses.status, filters.status));
    if (filters?.pondId) conditions.push(eq(expenses.pondId, filters.pondId));
    if (filters?.search) conditions.push(like(expenses.description, `%${filters.search}%`));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(expenses.expenseDate, filters.startDate, filters.endDate));
    } else if (filters?.startDate) {
      conditions.push(gte(expenses.expenseDate, filters.startDate));
    } else if (filters?.endDate) {
      conditions.push(lte(expenses.expenseDate, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: expenses.id,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        expenseDate: expenses.expenseDate,
        description: expenses.description,
        amount: expenses.amount,
        quantity: expenses.quantity,
        unit: expenses.unit,
        unitCost: expenses.unitCost,
        vendor: expenses.vendor,
        pondId: expenses.pondId,
        pondName: ponds.name,
        isRecurring: expenses.isRecurring,
        recurrenceInterval: expenses.recurrenceInterval,
        status: expenses.status,
        recordedBy: expenses.recordedBy,
        approvedBy: expenses.approvedBy,
        createdAt: expenses.createdAt,
      })
        .from(expenses)
        .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
        .leftJoin(ponds, eq(expenses.pondId, ponds.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(expenses.expenseDate)),
      db.select({ count: sql<number>`count(*)::int` }).from(expenses).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [expense] = await db
      .select({
        id: expenses.id,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        expenseDate: expenses.expenseDate,
        description: expenses.description,
        amount: expenses.amount,
        quantity: expenses.quantity,
        unit: expenses.unit,
        unitCost: expenses.unitCost,
        vendor: expenses.vendor,
        receiptUrl: expenses.receiptUrl,
        pondId: expenses.pondId,
        isRecurring: expenses.isRecurring,
        recurrenceInterval: expenses.recurrenceInterval,
        status: expenses.status,
        recordedBy: expenses.recordedBy,
        approvedBy: expenses.approvedBy,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(eq(expenses.id, id))
      .limit(1);

    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  async create(data: {
    categoryId: number;
    expenseDate: string;
    description: string;
    amount?: number;
    quantity?: number;
    unit?: string;
    unitCost?: number;
    vendor?: string;
    receiptUrl?: string;
    pondId?: number;
    isRecurring?: boolean;
    recurrenceInterval?: string;
    notes?: string;
  }, userId?: number) {
    let amount = data.amount;
    if (!amount && data.quantity && data.unitCost) {
      amount = data.quantity * data.unitCost;
    }
    if (!amount) throw new AppError('Amount is required (or provide quantity and unitCost)', 400);

    const [expense] = await db.insert(expenses).values({
      categoryId: data.categoryId,
      expenseDate: data.expenseDate,
      description: data.description,
      amount: String(amount),
      quantity: data.quantity ? String(data.quantity) : undefined,
      unit: data.unit,
      unitCost: data.unitCost ? String(data.unitCost) : undefined,
      vendor: data.vendor,
      receiptUrl: data.receiptUrl,
      pondId: data.pondId,
      isRecurring: data.isRecurring ?? false,
      recurrenceInterval: data.recurrenceInterval,
      recordedBy: userId,
      status: 'pending',
    }).returning();

    return expense;
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.id, id)).limit(1);
    if (!existing) throw new AppError('Expense not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.expenseDate !== undefined) updateData.expenseDate = data.expenseDate;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = String(data.amount);
    if (data.quantity !== undefined) updateData.quantity = String(data.quantity);
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.unitCost !== undefined) updateData.unitCost = String(data.unitCost);
    if (data.vendor !== undefined) updateData.vendor = data.vendor;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;
    if (data.pondId !== undefined) updateData.pondId = data.pondId;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
    if (data.recurrenceInterval !== undefined) updateData.recurrenceInterval = data.recurrenceInterval;

    const [expense] = await db.update(expenses).set(updateData).where(eq(expenses.id, id)).returning();
    return expense;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.id, id)).limit(1);
    if (!existing) throw new AppError('Expense not found', 404);
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async approve(id: number, userId: number) {
    const [expense] = await db.update(expenses).set({
      status: 'approved',
      approvedBy: userId,
      updatedAt: new Date(),
    }).where(eq(expenses.id, id)).returning();
    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  async reject(id: number, userId: number) {
    const [expense] = await db.update(expenses).set({
      status: 'rejected',
      approvedBy: userId,
      updatedAt: new Date(),
    }).where(eq(expenses.id, id)).returning();
    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  async getCategories() {
    return db.select().from(expenseCategories).orderBy(expenseCategories.name);
  }

  async createCategory(data: { name: string; parentId?: number; description?: string }) {
    const [category] = await db.insert(expenseCategories).values(data).returning();
    return category;
  }

  async getSummary(startDate?: string, endDate?: string) {
    const conditions = [eq(expenses.status, 'approved')];
    if (startDate) conditions.push(gte(expenses.expenseDate, startDate));
    if (endDate) conditions.push(lte(expenses.expenseDate, endDate));

    const summary = await db
      .select({
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        totalAmount: sql<number>`sum(${expenses.amount}::numeric)`,
        count: sql<number>`count(*)::int`,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(and(...conditions))
      .groupBy(expenses.categoryId, expenseCategories.name)
      .orderBy(sql`sum(${expenses.amount}::numeric) desc`);

    return summary;
  }
}
