import { pgTable, integer, varchar, text, boolean, decimal, timestamp } from 'drizzle-orm/pg-core';
import { ponds } from './ponds.schema';
import { users } from './users.schema';

export const aiAlerts = pgTable('ai_alerts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  pondId: integer('pond_id').references(() => ponds.id),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 10 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  recommendation: text('recommendation'),
  isRead: boolean('is_read').default(false),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  triggeredValue: decimal('triggered_value', { precision: 10, scale: 3 }),
  thresholdValue: decimal('threshold_value', { precision: 10, scale: 3 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
