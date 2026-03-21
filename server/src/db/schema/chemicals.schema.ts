import { pgTable, integer, varchar, text, decimal, timestamp } from 'drizzle-orm/pg-core';

export const chemicals = pgTable('chemicals', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 150 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull().default('kg'),
  currentStock: decimal('current_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  minimumStock: decimal('minimum_stock', { precision: 12, scale: 3 }).notNull().default('0'),
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
  supplier: varchar('supplier', { length: 200 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
