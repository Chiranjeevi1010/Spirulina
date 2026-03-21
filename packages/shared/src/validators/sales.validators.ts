import { z } from 'zod';

export const createCustomerSchema = z.object({
  companyName: z.string().max(200).optional(),
  contactName: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional().default('India'),
  customerType: z.enum(['shrimp_farmer', 'fish_farmer', 'nutraceutical', 'retail', 'export']),
  creditDays: z.number().int().min(0).optional().default(0),
  creditLimit: z.number().min(0).optional().default(0),
  gstNumber: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const createLeadSchema = z.object({
  contactName: z.string().min(1, 'Contact name is required').max(200),
  companyName: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  leadSource: z.enum(['referral', 'website', 'trade_show', 'cold_call', 'social_media']).optional(),
  customerType: z
    .enum(['shrimp_farmer', 'fish_farmer', 'nutraceutical', 'retail', 'export'])
    .optional(),
  estimatedValue: z.number().min(0).optional(),
  nextFollowUp: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.number().int().positive().optional(),
});

const orderItemSchema = z.object({
  productType: z.enum(['wet_spirulina', 'dry_powder', 'capsules', 'tablets']),
  batchId: z.number().int().positive().optional(),
  quantity: z.number().positive('Quantity is required'),
  unit: z.string().min(1),
  unitPrice: z.number().positive('Unit price is required'),
});

export const createOrderSchema = z.object({
  customerId: z.number().int().positive('Customer is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  deliveryDate: z.string().optional(),
  shippingAddress: z.string().optional(),
  taxAmount: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
