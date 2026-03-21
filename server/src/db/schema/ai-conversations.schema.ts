import { pgTable, integer, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { ponds } from './ponds.schema';

export const aiConversations = pgTable('ai_conversations', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 200 }),
  provider: varchar('provider', { length: 20 }).notNull(),
  model: varchar('model', { length: 50 }),
  contextType: varchar('context_type', { length: 50 }),
  contextPondId: integer('context_pond_id').references(() => ponds.id),
  messages: jsonb('messages').notNull().default([]),
  tokenUsage: integer('token_usage').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
