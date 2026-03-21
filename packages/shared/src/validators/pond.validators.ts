import { z } from 'zod';

export const createPondSchema = z.object({
  name: z.string().min(1, 'Pond name is required').max(100),
  code: z.string().min(1, 'Pond code is required').max(20),
  lengthM: z.number().positive('Length must be positive'),
  widthM: z.number().positive('Width must be positive'),
  depthM: z.number().positive('Depth must be positive'),
  pondType: z.enum(['open_raceway', 'closed_tank', 'tubular']).optional().default('open_raceway'),
  location: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'seeding']).optional().default('active'),
  dateCommissioned: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePondSchema = createPondSchema.partial();

export const createWaterParameterSchema = z.object({
  readingDate: z.string().min(1, 'Reading date is required'),
  readingTime: z.enum(['morning', 'noon', 'evening']),
  temperatureC: z.number().min(-10).max(60).optional(),
  ph: z.number().min(0).max(14).optional(),
  dissolvedOxygen: z.number().min(0).max(30).optional(),
  salinityPpt: z.number().min(0).max(100).optional(),
  alkalinity: z.number().min(0).optional(),
  carbonateCo3: z.number().min(0).optional(),
  bicarbonateHco3: z.number().min(0).optional(),
  totalHardness: z.number().min(0).optional(),
  calciumCa: z.number().min(0).optional(),
  magnesiumMg: z.number().min(0).optional(),
  sodiumNa: z.number().min(0).optional(),
  potassiumK: z.number().min(0).optional(),
  totalAmmonia: z.number().min(0).optional(),
  ammoniaNh3: z.number().min(0).optional(),
  nitriteNo2: z.number().min(0).optional(),
  nitrateNo3: z.number().min(0).optional(),
  foamLevel: z.enum(['none', 'low', 'medium', 'high']).optional().default('none'),
  paddleWheelRpm: z.number().min(0).optional(),
  harvestPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export type CreatePondInput = z.infer<typeof createPondSchema>;
export type UpdatePondInput = z.infer<typeof updatePondSchema>;
export type CreateWaterParameterInput = z.infer<typeof createWaterParameterSchema>;
