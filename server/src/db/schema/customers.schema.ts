import { pgTable, integer, varchar, text, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const customers = pgTable('customers', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  companyName: varchar('company_name', { length: 200 }),
  contactName: varchar('contact_name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }).default('India'),
  customerType: varchar('customer_type', { length: 50 }).notNull(),
  creditDays: integer('credit_days').default(0),
  creditLimit: decimal('credit_limit', { precision: 12, scale: 2 }).default('0'),
  outstandingAmount: decimal('outstanding_amount', { precision: 12, scale: 2 }).default('0'),
  gstNumber: varchar('gst_number', { length: 50 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
