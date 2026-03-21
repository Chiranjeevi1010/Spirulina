import { pgTable, integer, varchar, text, decimal, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { expenseCategories } from './expense-categories.schema';
import { ponds } from './ponds.schema';
import { users } from './users.schema';

export const expenses = pgTable('expenses', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  categoryId: integer('category_id').notNull().references(() => expenseCategories.id),
  expenseDate: date('expense_date').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }),
  unit: varchar('unit', { length: 20 }),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }),
  vendor: varchar('vendor', { length: 200 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  pondId: integer('pond_id').references(() => ponds.id),
  isRecurring: boolean('is_recurring').default(false),
  recurrenceInterval: varchar('recurrence_interval', { length: 20 }),
  recordedBy: integer('recorded_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
