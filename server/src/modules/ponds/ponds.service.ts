import { eq, like, and, sql, desc } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { ponds } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import { calculatePondVolume } from '@spirulina/shared';
import type { CreatePondInput, UpdatePondInput } from '@spirulina/shared';

export class PondsService {
  async list(page: number, limit: number, filters?: { status?: string; healthStatus?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.status) conditions.push(eq(ponds.status, filters.status));
    if (filters?.healthStatus) conditions.push(eq(ponds.healthStatus, filters.healthStatus));
    if (filters?.search) conditions.push(like(ponds.name, `%${filters.search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(ponds).where(whereClause).limit(limit).offset(offset).orderBy(desc(ponds.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(ponds).where(whereClause),
    ]);

    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getById(id: number) {
    const [pond] = await db.select().from(ponds).where(eq(ponds.id, id)).limit(1);
    if (!pond) throw new AppError('Pond not found', 404);
    return pond;
  }

  async create(data: CreatePondInput, userId?: number) {
    // Check unique code
    const [existing] = await db.select({ id: ponds.id }).from(ponds).where(eq(ponds.code, data.code)).limit(1);
    if (existing) throw new AppError('Pond code already exists', 409);

    const volumeLiters = calculatePondVolume(data.lengthM, data.widthM, data.depthM);

    const [pond] = await db.insert(ponds).values({
      name: data.name,
      code: data.code,
      lengthM: String(data.lengthM),
      widthM: String(data.widthM),
      depthM: String(data.depthM),
      volumeLiters: String(volumeLiters),
      pondType: data.pondType || 'open_raceway',
      location: data.location,
      status: data.status || 'active',
      dateCommissioned: data.dateCommissioned,
      notes: data.notes,
      createdBy: userId,
    }).returning();

    return pond;
  }

  async update(id: number, data: UpdatePondInput) {
    const [existing] = await db.select({ id: ponds.id }).from(ponds).where(eq(ponds.id, id)).limit(1);
    if (!existing) throw new AppError('Pond not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.pondType !== undefined) updateData.pondType = data.pondType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.dateCommissioned !== undefined) updateData.dateCommissioned = data.dateCommissioned;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Recalculate volume if dimensions changed
    if (data.lengthM !== undefined || data.widthM !== undefined || data.depthM !== undefined) {
      const current = await this.getById(id);
      const length = data.lengthM ?? Number(current.lengthM);
      const width = data.widthM ?? Number(current.widthM);
      const depth = data.depthM ?? Number(current.depthM);
      updateData.lengthM = String(length);
      updateData.widthM = String(width);
      updateData.depthM = String(depth);
      updateData.volumeLiters = String(calculatePondVolume(length, width, depth));
    }

    const [pond] = await db.update(ponds).set(updateData).where(eq(ponds.id, id)).returning();
    return pond;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: ponds.id }).from(ponds).where(eq(ponds.id, id)).limit(1);
    if (!existing) throw new AppError('Pond not found', 404);

    await db.update(ponds).set({ status: 'inactive', updatedAt: new Date() }).where(eq(ponds.id, id));
  }

  async updateStatus(id: number, status: string) {
    const [pond] = await db.update(ponds).set({ status, updatedAt: new Date() }).where(eq(ponds.id, id)).returning();
    if (!pond) throw new AppError('Pond not found', 404);
    return pond;
  }

  async getOverview() {
    const allPonds = await db.select({
      id: ponds.id,
      name: ponds.name,
      code: ponds.code,
      status: ponds.status,
      healthStatus: ponds.healthStatus,
      volumeLiters: ponds.volumeLiters,
    }).from(ponds).where(eq(ponds.status, 'active'));

    return allPonds;
  }
}
