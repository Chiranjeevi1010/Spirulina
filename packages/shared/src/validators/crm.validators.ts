import { z } from 'zod';

export const reviewExtractedLeadSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
});

export const bulkReviewSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  status: z.enum(['approved', 'rejected']),
});

export const createEmailTemplateSchema = z.object({
  templateName: z.string().min(1, 'Template name is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required'),
  category: z.string().min(1, 'Category is required').max(50),
});

export const sendEmailSchema = z.object({
  recipientEmail: z.string().email('Valid email is required'),
  recipientName: z.string().max(200).optional(),
  subject: z.string().min(1, 'Subject is required').max(500).optional(),
  body: z.string().optional(),
  templateId: z.number().int().positive().optional(),
  leadId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
});

export const bulkSendEmailSchema = z.object({
  leadIds: z.array(z.number().int().positive()).min(1),
  templateId: z.number().int().positive(),
});

export const createCallLogSchema = z.object({
  leadId: z.number().int().positive().optional(),
  customerId: z.number().int().positive().optional(),
  callDate: z.string().min(1, 'Call date is required'),
  callTime: z.string().max(10).optional(),
  duration: z.number().int().min(0).optional(),
  callType: z.enum(['outgoing', 'incoming']),
  outcome: z.enum(['connected', 'no_answer', 'busy', 'voicemail', 'callback_scheduled']),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().optional(),
});

export const updateCallLogSchema = createCallLogSchema.partial();

export type ReviewExtractedLeadInput = z.infer<typeof reviewExtractedLeadSchema>;
export type BulkReviewInput = z.infer<typeof bulkReviewSchema>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type BulkSendEmailInput = z.infer<typeof bulkSendEmailSchema>;
export type CreateCallLogInput = z.infer<typeof createCallLogSchema>;
export type UpdateCallLogInput = z.infer<typeof updateCallLogSchema>;
