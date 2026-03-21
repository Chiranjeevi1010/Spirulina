import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { batches, batchTests } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class BatchesService {
  private async generateBatchNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(batches)
      .where(sql`to_char(${batches.createdAt}, 'YYYYMMDD') = ${dateStr}`);
    const seq = String((result?.count ?? 0) + 1).padStart(4, '0');
    return `BAT-${dateStr}-${seq}`;
  }

  async list(page: number, limit: number, filters?: { productType?: string; status?: string; sourcePondId?: number }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.productType) conditions.push(eq(batches.productType, filters.productType));
    if (filters?.status) conditions.push(eq(batches.status, filters.status));
    if (filters?.sourcePondId) conditions.push(eq(batches.sourcePondId, filters.sourcePondId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(batches).where(whereClause).limit(limit).offset(offset).orderBy(desc(batches.productionDate)),
      db.select({ count: sql<number>`count(*)::int` }).from(batches).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id)).limit(1);
    if (!batch) throw new AppError('Batch not found', 404);

    const tests = await db.select().from(batchTests).where(eq(batchTests.batchId, id)).orderBy(desc(batchTests.testDate));

    return { ...batch, tests };
  }

  async create(data: {
    productType: string;
    quantity: number;
    unit: string;
    productionDate: string;
    expiryDate: string;
    sourcePondId?: number;
    moistureContent?: number;
    proteinContent?: number;
    notes?: string;
  }, userId?: number) {
    const batchNumber = await this.generateBatchNumber();

    const [batch] = await db.insert(batches).values({
      batchNumber,
      productType: data.productType,
      quantity: String(data.quantity),
      unit: data.unit,
      productionDate: data.productionDate,
      expiryDate: data.expiryDate,
      sourcePondId: data.sourcePondId,
      moistureContent: data.moistureContent ? String(data.moistureContent) : undefined,
      proteinContent: data.proteinContent ? String(data.proteinContent) : undefined,
      notes: data.notes,
      createdBy: userId,
    }).returning();

    return batch;
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: batches.id }).from(batches).where(eq(batches.id, id)).limit(1);
    if (!existing) throw new AppError('Batch not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.productType !== undefined) updateData.productType = data.productType;
    if (data.quantity !== undefined) updateData.quantity = String(data.quantity);
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.moistureContent !== undefined) updateData.moistureContent = String(data.moistureContent);
    if (data.proteinContent !== undefined) updateData.proteinContent = String(data.proteinContent);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [batch] = await db.update(batches).set(updateData).where(eq(batches.id, id)).returning();
    return batch;
  }

  async updateStatus(id: number, status: string) {
    const [batch] = await db.update(batches).set({
      status,
      updatedAt: new Date(),
    }).where(eq(batches.id, id)).returning();
    if (!batch) throw new AppError('Batch not found', 404);
    return batch;
  }

  async addTest(batchId: number, data: {
    testDate: string;
    testType: string;
    parameter: string;
    value?: number;
    unit?: string;
    resultStatus?: string;
    labName?: string;
    certificateUrl?: string;
  }, userId?: number) {
    const [existing] = await db.select({ id: batches.id }).from(batches).where(eq(batches.id, batchId)).limit(1);
    if (!existing) throw new AppError('Batch not found', 404);

    const [test] = await db.insert(batchTests).values({
      batchId,
      testDate: data.testDate,
      testType: data.testType,
      parameter: data.parameter,
      value: data.value ? String(data.value) : undefined,
      unit: data.unit,
      resultStatus: data.resultStatus || 'pass',
      labName: data.labName,
      certificateUrl: data.certificateUrl,
      testedBy: userId,
    }).returning();

    return test;
  }

  async getTests(batchId: number) {
    return db.select().from(batchTests).where(eq(batchTests.batchId, batchId)).orderBy(desc(batchTests.testDate));
  }

  async getExpiringBatches(daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);

    return db.select().from(batches)
      .where(and(
        eq(batches.status, 'available'),
        lte(batches.expiryDate, futureDateStr),
        gte(batches.expiryDate, todayStr),
      ))
      .orderBy(batches.expiryDate);
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: batches.id }).from(batches).where(eq(batches.id, id)).limit(1);
    if (!existing) throw new AppError('Batch not found', 404);
    await db.delete(batches).where(eq(batches.id, id));
  }
}
