import { pgTable, integer, varchar, text, date, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { leads } from './leads.schema';
import { users } from './users.schema';

export const extractedLeads = pgTable('extracted_leads', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  businessName: varchar('business_name', { length: 200 }).notNull(),
  contactName: varchar('contact_name', { length: 200 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  address: text('address'),
  category: varchar('category', { length: 50 }).notNull(),
  googlePlaceId: varchar('google_place_id', { length: 300 }).notNull().unique(),
  extractionDate: date('extraction_date').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('new'),
  approvedLeadId: integer('approved_lead_id').references(() => leads.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  notes: text('notes'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
