import { z } from 'zod';

export const createChemicalSchema = z.object({
  name: z.string().min(1, 'Chemical name is required').max(150),
  category: z.enum(['nutrient', 'mineral', 'trace_element', 'buffer']),
  unit: z.enum(['kg', 'liters', 'grams']).optional().default('kg'),
  currentStock: z.number().min(0).optional().default(0),
  minimumStock: z.number().min(0).optional().default(0),
  costPerUnit: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  notes: z.string().optional(),
});

export const createChemicalUsageSchema = z.object({
  chemicalId: z.number().int().positive('Chemical is required'),
  pondId: z.number().int().positive('Pond is required'),
  usageDate: z.string().min(1, 'Usage date is required'),
  quantityUsed: z.number().positive('Quantity is required'),
  unit: z.string().min(1),
  purpose: z.string().max(200).optional(),
  aiRecommended: z.boolean().optional().default(false),
  recommendedQty: z.number().optional(),
  notes: z.string().optional(),
});

export const dosingCalcSchema = z.object({
  currentPpm: z.number().min(0),
  targetPpm: z.number().min(0),
  pondId: z.number().int().positive(),
  purityFraction: z.number().min(0.01).max(1).optional().default(1),
});

export type CreateChemicalInput = z.infer<typeof createChemicalSchema>;
export type CreateChemicalUsageInput = z.infer<typeof createChemicalUsageSchema>;
export type DosingCalcInput = z.infer<typeof dosingCalcSchema>;
