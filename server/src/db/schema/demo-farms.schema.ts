import { pgTable, integer, varchar, text, decimal, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const demoFarms = pgTable('demo_farms', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  farmName: varchar('farm_name', { length: 200 }).notNull(),
  farmerName: varchar('farmer_name', { length: 200 }).notNull(),
  location: varchar('location', { length: 300 }),
  farmType: varchar('farm_type', { length: 50 }),
  areaAcres: decimal('area_acres', { precision: 8, scale: 2 }),
  trialStartDate: date('trial_start_date'),
  trialEndDate: date('trial_end_date'),
  status: varchar('status', { length: 20 }).default('active'),
  spirulinaDose: varchar('spirulina_dose', { length: 200 }),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  roiPercentage: decimal('roi_percentage', { precision: 6, scale: 2 }),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
