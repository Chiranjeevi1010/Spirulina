import { eq, and, sql, desc, lte, gte, like, between } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { chemicals, chemicalUsage, ponds } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class ChemicalsService {
  async list(page: number, limit: number, filters?: { category?: string; search?: string; lowStock?: boolean }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.category) conditions.push(eq(chemicals.category, filters.category));
    if (filters?.search) conditions.push(like(chemicals.name, `%${filters.search}%`));
    if (filters?.lowStock) conditions.push(sql`${chemicals.currentStock}::numeric <= ${chemicals.minimumStock}::numeric`);

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(chemicals).where(whereClause).limit(limit).offset(offset).orderBy(chemicals.name),
      db.select({ count: sql<number>`count(*)::int` }).from(chemicals).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [chemical] = await db.select().from(chemicals).where(eq(chemicals.id, id)).limit(1);
    if (!chemical) throw new AppError('Chemical not found', 404);
    return chemical;
  }

  async create(data: {
    name: string;
    category: string;
    unit?: string;
    currentStock?: number;
    minimumStock?: number;
    costPerUnit?: number;
    supplier?: string;
    notes?: string;
  }) {
    const [chemical] = await db.insert(chemicals).values({
      name: data.name,
      category: data.category,
      unit: data.unit || 'kg',
      currentStock: data.currentStock ? String(data.currentStock) : '0',
      minimumStock: data.minimumStock ? String(data.minimumStock) : '0',
      costPerUnit: data.costPerUnit ? String(data.costPerUnit) : undefined,
      supplier: data.supplier,
      notes: data.notes,
    }).returning();

    return chemical;
  }

  async update(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: chemicals.id }).from(chemicals).where(eq(chemicals.id, id)).limit(1);
    if (!existing) throw new AppError('Chemical not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.currentStock !== undefined) updateData.currentStock = String(data.currentStock);
    if (data.minimumStock !== undefined) updateData.minimumStock = String(data.minimumStock);
    if (data.costPerUnit !== undefined) updateData.costPerUnit = String(data.costPerUnit);
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [chemical] = await db.update(chemicals).set(updateData).where(eq(chemicals.id, id)).returning();
    return chemical;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: chemicals.id }).from(chemicals).where(eq(chemicals.id, id)).limit(1);
    if (!existing) throw new AppError('Chemical not found', 404);
    await db.delete(chemicals).where(eq(chemicals.id, id));
  }

  async logUsage(data: {
    chemicalId: number;
    pondId: number;
    usageDate: string;
    quantityUsed: number;
    unit: string;
    purpose?: string;
    aiRecommended?: boolean;
    recommendedQty?: number;
    notes?: string;
  }, userId?: number) {
    // Verify chemical exists
    const [chemical] = await db.select().from(chemicals).where(eq(chemicals.id, data.chemicalId)).limit(1);
    if (!chemical) throw new AppError('Chemical not found', 404);

    // Insert usage log
    const [usage] = await db.insert(chemicalUsage).values({
      chemicalId: data.chemicalId,
      pondId: data.pondId,
      usageDate: data.usageDate,
      quantityUsed: String(data.quantityUsed),
      unit: data.unit,
      purpose: data.purpose,
      aiRecommended: data.aiRecommended ?? false,
      recommendedQty: data.recommendedQty ? String(data.recommendedQty) : undefined,
      recordedBy: userId,
      notes: data.notes,
    }).returning();

    // Decrement stock
    const newStock = Math.max(0, Number(chemical.currentStock) - data.quantityUsed);
    await db.update(chemicals).set({
      currentStock: String(newStock),
      updatedAt: new Date(),
    }).where(eq(chemicals.id, data.chemicalId));

    return usage;
  }

  async getUsageLog(page: number, limit: number, filters?: { chemicalId?: number; pondId?: number; startDate?: string; endDate?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.chemicalId) conditions.push(eq(chemicalUsage.chemicalId, filters.chemicalId));
    if (filters?.pondId) conditions.push(eq(chemicalUsage.pondId, filters.pondId));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(chemicalUsage.usageDate, filters.startDate, filters.endDate));
    } else if (filters?.startDate) {
      conditions.push(gte(chemicalUsage.usageDate, filters.startDate));
    } else if (filters?.endDate) {
      conditions.push(lte(chemicalUsage.usageDate, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: chemicalUsage.id,
        chemicalId: chemicalUsage.chemicalId,
        chemicalName: chemicals.name,
        pondId: chemicalUsage.pondId,
        pondName: ponds.name,
        usageDate: chemicalUsage.usageDate,
        quantityUsed: chemicalUsage.quantityUsed,
        unit: chemicalUsage.unit,
        purpose: chemicalUsage.purpose,
        aiRecommended: chemicalUsage.aiRecommended,
        recommendedQty: chemicalUsage.recommendedQty,
        recordedBy: chemicalUsage.recordedBy,
        notes: chemicalUsage.notes,
        createdAt: chemicalUsage.createdAt,
      })
        .from(chemicalUsage)
        .leftJoin(chemicals, eq(chemicalUsage.chemicalId, chemicals.id))
        .leftJoin(ponds, eq(chemicalUsage.pondId, ponds.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(chemicalUsage.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(chemicalUsage).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async updateUsage(id: number, data: {
    usageDate?: string;
    quantityUsed?: number;
    purpose?: string;
    notes?: string;
  }) {
    const [existing] = await db.select().from(chemicalUsage).where(eq(chemicalUsage.id, id)).limit(1);
    if (!existing) throw new AppError('Usage record not found', 404);

    // Adjust stock if quantity changed
    if (data.quantityUsed !== undefined) {
      const oldQty = Number(existing.quantityUsed);
      const newQty = data.quantityUsed;
      const diff = newQty - oldQty;
      if (diff !== 0) {
        const [chemical] = await db.select({ id: chemicals.id, currentStock: chemicals.currentStock })
          .from(chemicals).where(eq(chemicals.id, existing.chemicalId)).limit(1);
        if (chemical) {
          const newStock = Math.max(0, Number(chemical.currentStock) - diff);
          await db.update(chemicals).set({
            currentStock: String(newStock),
            updatedAt: new Date(),
          }).where(eq(chemicals.id, existing.chemicalId));
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.usageDate !== undefined) updateData.usageDate = data.usageDate;
    if (data.quantityUsed !== undefined) updateData.quantityUsed = String(data.quantityUsed);
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updated] = await db.update(chemicalUsage).set(updateData).where(eq(chemicalUsage.id, id)).returning();
    return updated;
  }

  async getLowStockAlerts() {
    return db.select().from(chemicals).where(
      sql`${chemicals.currentStock}::numeric <= ${chemicals.minimumStock}::numeric`
    ).orderBy(chemicals.name);
  }
}
