import { eq, and, sql, desc, gte, lte, between } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { production, harvests } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class ProductionService {
  async list(page: number, limit: number, filters?: { startDate?: string; endDate?: string; dryerType?: string; outputType?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.dryerType) conditions.push(eq(production.dryerType, filters.dryerType));
    if (filters?.outputType) conditions.push(eq(production.outputType, filters.outputType));
    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(production.productionDate, filters.startDate, filters.endDate));
    } else if (filters?.startDate) {
      conditions.push(gte(production.productionDate, filters.startDate));
    } else if (filters?.endDate) {
      conditions.push(lte(production.productionDate, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(production).where(whereClause).limit(limit).offset(offset).orderBy(desc(production.productionDate)),
      db.select({ count: sql<number>`count(*)::int` }).from(production).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [record] = await db.select().from(production).where(eq(production.id, id)).limit(1);
    if (!record) throw new AppError('Production record not found', 404);
    return record;
  }

  async create(data: {
    harvestId?: number;
    productionDate: string;
    wetInputKg: number;
    outputType?: string;
    wetOutputKg?: number;
    dryerType?: string;
    dryingTimeHours?: number;
    finalMoisturePct?: number;
    powderOutputKg?: number;
    costPerKgDry?: number;
    batchId?: number;
    notes?: string;
  }, userId?: number) {
    const wetOutput = data.wetOutputKg || 0;
    const powderOutput = data.powderOutputKg || 0;
    const totalOutput = wetOutput + powderOutput;
    const wetToDryRatio = powderOutput > 0 ? powderOutput / data.wetInputKg : 0;
    const efficiencyPct = data.wetInputKg > 0 ? (totalOutput / data.wetInputKg) * 100 : 0;

    const [record] = await db.insert(production).values({
      harvestId: data.harvestId,
      productionDate: data.productionDate,
      wetInputKg: String(data.wetInputKg),
      outputType: data.outputType || 'powder',
      wetOutputKg: String(wetOutput),
      dryerType: data.dryerType || 'none',
      dryingTimeHours: data.dryingTimeHours ? String(data.dryingTimeHours) : undefined,
      finalMoisturePct: data.finalMoisturePct ? String(data.finalMoisturePct) : undefined,
      powderOutputKg: String(powderOutput),
      wetToDryRatio: String(wetToDryRatio.toFixed(3)),
      efficiencyPct: String(efficiencyPct.toFixed(2)),
      costPerKgDry: data.costPerKgDry ? String(data.costPerKgDry) : undefined,
      batchId: data.batchId,
      notes: data.notes,
      recordedBy: userId,
    }).returning();

    return record;
  }

  async update(id: number, data: Record<string, unknown>) {
    const existing = await this.getById(id);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.harvestId !== undefined) updateData.harvestId = data.harvestId;
    if (data.productionDate !== undefined) updateData.productionDate = data.productionDate;
    if (data.outputType !== undefined) updateData.outputType = data.outputType;
    if (data.dryerType !== undefined) updateData.dryerType = data.dryerType;
    if (data.dryingTimeHours !== undefined) updateData.dryingTimeHours = String(data.dryingTimeHours);
    if (data.finalMoisturePct !== undefined) updateData.finalMoisturePct = String(data.finalMoisturePct);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const wetInput = data.wetInputKg !== undefined ? Number(data.wetInputKg) : Number(existing.wetInputKg);
    const powderOutput = data.powderOutputKg !== undefined ? Number(data.powderOutputKg) : Number(existing.powderOutputKg);
    const wetOutput = data.wetOutputKg !== undefined ? Number(data.wetOutputKg) : Number(existing.wetOutputKg || 0);

    if (data.wetInputKg !== undefined) updateData.wetInputKg = String(wetInput);
    if (data.powderOutputKg !== undefined) updateData.powderOutputKg = String(powderOutput);
    if (data.wetOutputKg !== undefined) updateData.wetOutputKg = String(wetOutput);

    if (data.wetInputKg !== undefined || data.powderOutputKg !== undefined || data.wetOutputKg !== undefined) {
      const totalOutput = wetOutput + powderOutput;
      updateData.wetToDryRatio = powderOutput > 0 ? String((powderOutput / wetInput).toFixed(3)) : '0';
      updateData.efficiencyPct = wetInput > 0 ? String(((totalOutput / wetInput) * 100).toFixed(2)) : '0';
    }

    const [record] = await db.update(production).set(updateData).where(eq(production.id, id)).returning();
    return record;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: production.id }).from(production).where(eq(production.id, id)).limit(1);
    if (!existing) throw new AppError('Production record not found', 404);
    await db.delete(production).where(eq(production.id, id));
  }

  async getEfficiencyStats(startDate?: string, endDate?: string) {
    const conditions = [];
    if (startDate) conditions.push(gte(production.productionDate, startDate));
    if (endDate) conditions.push(lte(production.productionDate, endDate));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        avgEfficiency: sql<number>`coalesce(avg(${production.efficiencyPct}::numeric), 0)`,
        totalWetInput: sql<number>`coalesce(sum(${production.wetInputKg}::numeric), 0)`,
        totalPowderOutput: sql<number>`coalesce(sum(${production.powderOutputKg}::numeric), 0)`,
        totalWetOutput: sql<number>`coalesce(sum(coalesce(${production.wetOutputKg}::numeric, 0)), 0)`,
        recordCount: sql<number>`count(*)::int`,
      })
      .from(production)
      .where(whereClause);

    return stats;
  }
}
