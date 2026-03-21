import { pgTable, integer, varchar, text, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const ponds = pgTable('ponds', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  lengthM: decimal('length_m', { precision: 8, scale: 2 }).notNull(),
  widthM: decimal('width_m', { precision: 8, scale: 2 }).notNull(),
  depthM: decimal('depth_m', { precision: 8, scale: 3 }).notNull(),
  volumeLiters: decimal('volume_liters', { precision: 12, scale: 2 }).notNull(),
  pondType: varchar('pond_type', { length: 50 }).notNull().default('open_raceway'),
  location: varchar('location', { length: 200 }),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  healthStatus: varchar('health_status', { length: 10 }).notNull().default('GREEN'),
  dateCommissioned: date('date_commissioned'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
