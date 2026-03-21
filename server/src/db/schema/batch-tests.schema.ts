import { pgTable, integer, varchar, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { batches } from './batches.schema';
import { users } from './users.schema';

export const batchTests = pgTable('batch_tests', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  batchId: integer('batch_id').notNull().references(() => batches.id, { onDelete: 'cascade' }),
  testDate: date('test_date').notNull(),
  testType: varchar('test_type', { length: 100 }).notNull(),
  parameter: varchar('parameter', { length: 100 }).notNull(),
  value: decimal('value', { precision: 10, scale: 4 }),
  unit: varchar('unit', { length: 30 }),
  resultStatus: varchar('result_status', { length: 20 }).default('pass'),
  labName: varchar('lab_name', { length: 200 }),
  certificateUrl: varchar('certificate_url', { length: 500 }),
  testedBy: integer('tested_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
