import { pgTable, integer, text, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers.schema';
import { demoFarms } from './demo-farms.schema';
import { users } from './users.schema';

export const testimonials = pgTable('testimonials', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer('customer_id').references(() => customers.id),
  demoFarmId: integer('demo_farm_id').references(() => demoFarms.id),
  content: text('content').notNull(),
  rating: integer('rating'),
  mediaUrls: jsonb('media_urls').default([]),
  isPublished: boolean('is_published').default(false),
  approvedBy: integer('approved_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
