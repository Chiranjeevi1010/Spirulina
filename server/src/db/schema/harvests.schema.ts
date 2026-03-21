import { pgTable, integer, varchar, text, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { ponds } from './ponds.schema';
import { users } from './users.schema';

export const harvests = pgTable('harvests', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  pondId: integer('pond_id').notNull().references(() => ponds.id),
  harvestDate: date('harvest_date').notNull(),
  wetHarvestKg: decimal('wet_harvest_kg', { precision: 10, scale: 3 }).notNull(),
  solidsPercentage: decimal('solids_percentage', { precision: 5, scale: 2 }),
  dryYieldPercentage: decimal('dry_yield_percentage', { precision: 5, scale: 2 }),
  harvestMethod: varchar('harvest_method', { length: 50 }).default('filtration'),
  notes: text('notes'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
