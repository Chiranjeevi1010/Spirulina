import { pgTable, integer, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { leads } from './leads.schema';
import { customers } from './customers.schema';
import { emailTemplates } from './email-templates.schema';
import { users } from './users.schema';

export const emailLogs = pgTable('email_logs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  leadId: integer('lead_id').references(() => leads.id),
  customerId: integer('customer_id').references(() => customers.id),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  recipientName: varchar('recipient_name', { length: 200 }),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  templateId: integer('template_id').references(() => emailTemplates.id),
  status: varchar('status', { length: 20 }).notNull().default('queued'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  sentBy: integer('sent_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
