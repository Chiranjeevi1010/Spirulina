import { pgTable, integer, varchar, text, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { harvests } from './harvests.schema';
import { batches } from './batches.schema';
import { users } from './users.schema';

export const production = pgTable('production', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  harvestId: integer('harvest_id').references(() => harvests.id),
  productionDate: date('production_date').notNull(),
  wetInputKg: decimal('wet_input_kg', { precision: 10, scale: 3 }).notNull(),
  // Output columns — wet output for direct shrimp/fish sales, powder for dried product
  wetOutputKg: decimal('wet_output_kg', { precision: 10, scale: 3 }).default('0'),
  outputType: varchar('output_type', { length: 20 }).notNull().default('powder'),  // 'powder' | 'wet' | 'both'
  dryerType: varchar('dryer_type', { length: 50 }),
  dryingTimeHours: decimal('drying_time_hours', { precision: 6, scale: 2 }),
  finalMoisturePct: decimal('final_moisture_pct', { precision: 5, scale: 2 }),
  powderOutputKg: decimal('powder_output_kg', { precision: 10, scale: 3 }).default('0'),
  wetToDryRatio: decimal('wet_to_dry_ratio', { precision: 6, scale: 3 }),
  efficiencyPct: decimal('efficiency_pct', { precision: 5, scale: 2 }),
  costPerKgDry: decimal('cost_per_kg_dry', { precision: 10, scale: 2 }),
  batchId: integer('batch_id').references(() => batches.id),
  notes: text('notes'),
  recordedBy: integer('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
