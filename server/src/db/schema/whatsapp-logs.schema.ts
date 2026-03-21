import { pgTable, integer, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders.schema';
import { customers } from './customers.schema';

export const whatsappLogs = pgTable('whatsapp_logs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer('order_id').references(() => orders.id),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  templateName: varchar('template_name', { length: 100 }).notNull(),
  messageType: varchar('message_type', { length: 30 }).notNull(),
  waMessageId: varchar('wa_message_id', { length: 100 }),
  status: varchar('status', { length: 20 }).notNull().default('sent'),
  errorMessage: text('error_message'),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
