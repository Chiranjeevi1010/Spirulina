import { pgTable, integer, varchar, text, decimal, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { chemicals } from './chemicals.schema';
import { ponds } from './ponds.schema';
import { users } from './users.schema';

export const chemicalUsage = pgTable('chemical_usage', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  chemicalId: integer('chemical_id').notNull().references(() => chemicals.id),
  pondId: integer('pond_id').notNull().references(() => ponds.id),
  usageDate: date('usage_date').notNull(),
  quantityUsed: decimal('quantity_used', { precision: 10, scale: 3 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  purpose: varchar('purpose', { length: 200 }),
  aiRecommended: boolean('ai_recommended').default(false),
  recommendedQty: decimal('recommended_qty', { precision: 10, scale: 3 }),
  recordedBy: integer('recorded_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
