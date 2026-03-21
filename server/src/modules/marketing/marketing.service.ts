import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { demoFarms, testimonials, customers } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class MarketingService {
  // Demo Farms
  async listDemoFarms(page: number, limit: number, filters?: { status?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.status) conditions.push(eq(demoFarms.status, filters.status));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select().from(demoFarms).where(whereClause).limit(limit).offset(offset).orderBy(desc(demoFarms.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(demoFarms).where(whereClause),
    ]);
    return { data, total: countResult[0]?.count ?? 0 };
  }

  async getDemoFarmById(id: number) {
    const [farm] = await db.select().from(demoFarms).where(eq(demoFarms.id, id)).limit(1);
    if (!farm) throw new AppError('Demo farm not found', 404);
    return farm;
  }

  async createDemoFarm(data: Record<string, unknown>, userId?: number) {
    const [farm] = await db.insert(demoFarms).values({
      farmName: data.farmName as string,
      farmerName: data.farmerName as string,
      location: data.location as string,
      farmType: data.farmType as string,
      areaAcres: data.areaAcres ? String(data.areaAcres) : undefined,
      trialStartDate: data.trialStartDate as string,
      trialEndDate: data.trialEndDate as string,
      spirulinaDose: data.spirulinaDose as string,
      beforeData: data.beforeData,
      afterData: data.afterData,
      roiPercentage: data.roiPercentage ? String(data.roiPercentage) : undefined,
      notes: data.notes as string,
      createdBy: userId,
    }).returning();
    return farm;
  }

  async updateDemoFarm(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: demoFarms.id }).from(demoFarms).where(eq(demoFarms.id, id)).limit(1);
    if (!existing) throw new AppError('Demo farm not found', 404);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    const fields = ['farmName', 'farmerName', 'location', 'farmType', 'spirulinaDose', 'trialStartDate', 'trialEndDate', 'status', 'notes'];
    for (const f of fields) if (data[f] !== undefined) updateData[f] = data[f];
    if (data.areaAcres !== undefined) updateData.areaAcres = String(data.areaAcres);
    if (data.roiPercentage !== undefined) updateData.roiPercentage = String(data.roiPercentage);
    if (data.beforeData !== undefined) updateData.beforeData = data.beforeData;
    if (data.afterData !== undefined) updateData.afterData = data.afterData;

    const [farm] = await db.update(demoFarms).set(updateData).where(eq(demoFarms.id, id)).returning();
    return farm;
  }

  async deleteDemoFarm(id: number) {
    const [existing] = await db.select({ id: demoFarms.id }).from(demoFarms).where(eq(demoFarms.id, id)).limit(1);
    if (!existing) throw new AppError('Demo farm not found', 404);
    await db.delete(demoFarms).where(eq(demoFarms.id, id));
  }

  // Testimonials
  async listTestimonials(page: number, limit: number, filters?: { isPublished?: boolean }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.isPublished !== undefined) conditions.push(eq(testimonials.isPublished, filters.isPublished));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db.select({
        id: testimonials.id,
        customerId: testimonials.customerId,
        customerName: customers.contactName,
        demoFarmId: testimonials.demoFarmId,
        content: testimonials.content,
        rating: testimonials.rating,
        mediaUrls: testimonials.mediaUrls,
        isPublished: testimonials.isPublished,
        createdAt: testimonials.createdAt,
      })
        .from(testimonials)
        .leftJoin(customers, eq(testimonials.customerId, customers.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(testimonials.createdAt)),
      db.select({ count: sql<number>`count(*)::int` }).from(testimonials).where(whereClause),
    ]);
    return { data, total: countResult[0]?.count ?? 0 };
  }

  async createTestimonial(data: Record<string, unknown>) {
    const [testimonial] = await db.insert(testimonials).values({
      customerId: data.customerId as number,
      demoFarmId: data.demoFarmId as number,
      content: data.content as string,
      rating: data.rating as number,
      mediaUrls: data.mediaUrls || [],
    }).returning();
    return testimonial;
  }

  async updateTestimonial(id: number, data: Record<string, unknown>) {
    const [existing] = await db.select({ id: testimonials.id }).from(testimonials).where(eq(testimonials.id, id)).limit(1);
    if (!existing) throw new AppError('Testimonial not found', 404);

    const updateData: Record<string, unknown> = {};

    if (data.customerId !== undefined) updateData.customerId = data.customerId;
    if (data.demoFarmId !== undefined) updateData.demoFarmId = data.demoFarmId;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.mediaUrls !== undefined) updateData.mediaUrls = data.mediaUrls;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;

    const [testimonial] = await db.update(testimonials).set(updateData).where(eq(testimonials.id, id)).returning();
    return testimonial;
  }

  async publishTestimonial(id: number, userId: number) {
    const [testimonial] = await db.update(testimonials).set({
      isPublished: true,
      approvedBy: userId,
    }).where(eq(testimonials.id, id)).returning();
    if (!testimonial) throw new AppError('Testimonial not found', 404);
    return testimonial;
  }

  async deleteTestimonial(id: number) {
    await db.delete(testimonials).where(eq(testimonials.id, id));
  }
}
