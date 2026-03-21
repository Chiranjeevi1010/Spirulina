import { pgTable, integer, varchar, text, decimal, date, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';
import { users } from './users.schema';

export const orders = pgTable('orders', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  orderNumber: varchar('order_number', { length: 30 }).notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  orderDate: date('order_date').notNull(),
  deliveryDate: date('delivery_date'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('unpaid'),
  paymentDueDate: date('payment_due_date'),
  paymentReceived: decimal('payment_received', { precision: 12, scale: 2 }).default('0'),
  shippingAddress: text('shipping_address'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
