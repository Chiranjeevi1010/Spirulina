import { pgTable, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const expenseCategories = pgTable('expense_categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  parentId: integer('parent_id'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
