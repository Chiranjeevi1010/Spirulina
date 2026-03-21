import { eq, sql } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { inventory } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class InventoryService {
  async list() {
    return db.select().from(inventory).orderBy(inventory.productType);
  }

  async getById(id: number) {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
    if (!item) throw new AppError('Inventory item not found', 404);
    return item;
  }

  async updateQuantity(id: number, quantity: number) {
    const [item] = await db.update(inventory).set({
      currentQuantity: String(quantity),
      lastUpdated: new Date(),
    }).where(eq(inventory.id, id)).returning();
    if (!item) throw new AppError('Inventory item not found', 404);
    return item;
  }

  async create(data: { productType: string; currentQuantity?: number; unit: string; location?: string }) {
    const [item] = await db.insert(inventory).values({
      productType: data.productType,
      currentQuantity: data.currentQuantity ? String(data.currentQuantity) : '0',
      unit: data.unit,
      location: data.location,
    }).returning();
    return item;
  }

  async update(id: number, data: { productType?: string; currentQuantity?: number; unit?: string; location?: string }) {
    const [existing] = await db.select({ id: inventory.id }).from(inventory).where(eq(inventory.id, id)).limit(1);
    if (!existing) throw new AppError('Inventory item not found', 404);

    const updateData: Record<string, unknown> = { lastUpdated: new Date() };

    if (data.productType !== undefined) updateData.productType = data.productType;
    if (data.currentQuantity !== undefined) updateData.currentQuantity = String(data.currentQuantity);
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.location !== undefined) updateData.location = data.location;

    const [item] = await db.update(inventory).set(updateData).where(eq(inventory.id, id)).returning();
    return item;
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: inventory.id }).from(inventory).where(eq(inventory.id, id)).limit(1);
    if (!existing) throw new AppError('Inventory item not found', 404);

    await db.delete(inventory).where(eq(inventory.id, id));
  }

  async getOverview() {
    return db.select().from(inventory).orderBy(inventory.productType);
  }
}
