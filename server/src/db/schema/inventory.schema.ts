import { pgTable, integer, varchar, decimal, timestamp } from 'drizzle-orm/pg-core';

export const inventory = pgTable('inventory', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  productType: varchar('product_type', { length: 50 }).notNull(),
  currentQuantity: decimal('current_quantity', { precision: 12, scale: 3 }).notNull().default('0'),
  unit: varchar('unit', { length: 20 }).notNull(),
  location: varchar('location', { length: 200 }),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
