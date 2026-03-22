import { pgTable, integer, varchar, text, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { leads } from './leads.schema';
import { customers } from './customers.schema';
import { users } from './users.schema';

export const callLogs = pgTable('call_logs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  leadId: integer('lead_id').references(() => leads.id),
  customerId: integer('customer_id').references(() => customers.id),
  callerUserId: integer('caller_user_id').notNull().references(() => users.id),
  callDate: date('call_date').notNull(),
  callTime: varchar('call_time', { length: 10 }),
  duration: integer('duration'),
  callType: varchar('call_type', { length: 20 }).notNull(),
  outcome: varchar('outcome', { length: 30 }).notNull(),
  notes: text('notes'),
  followUpDate: date('follow_up_date'),
  followUpNotes: text('follow_up_notes'),
  followUpCompleted: boolean('follow_up_completed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
