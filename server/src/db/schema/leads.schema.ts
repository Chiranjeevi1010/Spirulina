import { pgTable, integer, varchar, text, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';
import { users } from './users.schema';

export const leads = pgTable('leads', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  contactName: varchar('contact_name', { length: 200 }).notNull(),
  companyName: varchar('company_name', { length: 200 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  leadSource: varchar('lead_source', { length: 50 }),
  customerType: varchar('customer_type', { length: 50 }),
  status: varchar('status', { length: 30 }).notNull().default('new'),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }),
  nextFollowUp: date('next_follow_up'),
  notes: text('notes'),
  convertedToCustomerId: integer('converted_to_customer_id').references(() => customers.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
