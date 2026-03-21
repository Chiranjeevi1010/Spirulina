import { eq, and } from 'drizzle-orm';
import { db } from '../../config/database.config.js';
import { settings } from '../../db/schema/index.js';
import { AppError } from '../../middleware/error-handler.middleware.js';

export class SettingsService {
  async getAll() {
    return db.select().from(settings).orderBy(settings.category, settings.key);
  }

  async getByCategory(category: string) {
    return db.select().from(settings).where(eq(settings.category, category)).orderBy(settings.key);
  }

  async get(category: string, key: string) {
    const [setting] = await db.select().from(settings)
      .where(and(eq(settings.category, category), eq(settings.key, key)))
      .limit(1);
    if (!setting) throw new AppError('Setting not found', 404);
    return setting;
  }

  async upsert(category: string, key: string, value: unknown, description?: string, userId?: number) {
    const [existing] = await db.select({ id: settings.id }).from(settings)
      .where(and(eq(settings.category, category), eq(settings.key, key)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(settings).set({
        value,
        description,
        updatedBy: userId,
        updatedAt: new Date(),
      }).where(eq(settings.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values({
        category,
        key,
        value,
        description,
        updatedBy: userId,
      }).returning();
      return created;
    }
  }

  async delete(id: number) {
    const [existing] = await db.select({ id: settings.id }).from(settings).where(eq(settings.id, id)).limit(1);
    if (!existing) throw new AppError('Setting not found', 404);
    await db.delete(settings).where(eq(settings.id, id));
  }
}
