import { pgTable, integer, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const emailTemplates = pgTable('email_templates', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  templateName: varchar('template_name', { length: 200 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
