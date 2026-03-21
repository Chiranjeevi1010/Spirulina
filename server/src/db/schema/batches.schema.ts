import { pgTable, integer, varchar, text, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { ponds } from './ponds.schema';
import { users } from './users.schema';

export const batches = pgTable('batches', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  batchNumber: varchar('batch_number', { length: 30 }).notNull().unique(),
  productType: varchar('product_type', { length: 50 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  productionDate: date('production_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('available'),
  sourcePondId: integer('source_pond_id').references(() => ponds.id),
  moistureContent: decimal('moisture_content', { precision: 5, scale: 2 }),
  proteinContent: decimal('protein_content', { precision: 5, scale: 2 }),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
