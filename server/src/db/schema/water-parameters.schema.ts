import { pgTable, bigint, integer, varchar, text, decimal, date, timestamp, unique } from 'drizzle-orm/pg-core';
import { ponds } from './ponds.schema';
import { users } from './users.schema';

export const waterParameters = pgTable('water_parameters', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  pondId: integer('pond_id').notNull().references(() => ponds.id, { onDelete: 'cascade' }),
  readingDate: date('reading_date').notNull(),
  readingTime: varchar('reading_time', { length: 10 }).notNull().default('morning'),
  temperatureC: decimal('temperature_c', { precision: 5, scale: 2 }),
  ph: decimal('ph', { precision: 4, scale: 2 }),
  dissolvedOxygen: decimal('dissolved_oxygen', { precision: 5, scale: 2 }),
  salinityPpt: decimal('salinity_ppt', { precision: 6, scale: 2 }),
  alkalinity: decimal('alkalinity', { precision: 8, scale: 2 }),
  carbonateCo3: decimal('carbonate_co3', { precision: 8, scale: 2 }),
  bicarbonateHco3: decimal('bicarbonate_hco3', { precision: 8, scale: 2 }),
  totalHardness: decimal('total_hardness', { precision: 8, scale: 2 }),
  calciumCa: decimal('calcium_ca', { precision: 8, scale: 2 }),
  magnesiumMg: decimal('magnesium_mg', { precision: 8, scale: 2 }),
  sodiumNa: decimal('sodium_na', { precision: 8, scale: 2 }),
  potassiumK: decimal('potassium_k', { precision: 8, scale: 2 }),
  totalAmmonia: decimal('total_ammonia', { precision: 6, scale: 3 }),
  ammoniaNh3: decimal('ammonia_nh3', { precision: 6, scale: 3 }),
  nitriteNo2: decimal('nitrite_no2', { precision: 6, scale: 3 }),
  nitrateNo3: decimal('nitrate_no3', { precision: 6, scale: 3 }),
  foamLevel: varchar('foam_level', { length: 10 }).default('none'),
  paddleWheelRpm: decimal('paddle_wheel_rpm', { precision: 6, scale: 1 }),
  harvestPercentage: decimal('harvest_percentage', { precision: 5, scale: 2 }),
  ammoniaRisk: varchar('ammonia_risk', { length: 10 }).default('GREEN'),
  doRisk: varchar('do_risk', { length: 10 }).default('GREEN'),
  hardnessRisk: varchar('hardness_risk', { length: 10 }).default('GREEN'),
  overallRisk: varchar('overall_risk', { length: 10 }).default('GREEN'),
  recordedBy: integer('recorded_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueReading: unique().on(table.pondId, table.readingDate, table.readingTime),
}));
