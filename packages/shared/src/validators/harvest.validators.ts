import { z } from 'zod';

export const createHarvestSchema = z.object({
  pondId: z.number().int().positive('Pond is required'),
  harvestDate: z.string().min(1, 'Harvest date is required'),
  wetHarvestKg: z.number().positive('Wet harvest weight is required'),
  solidsPercentage: z.number().min(0).max(100).optional(),
  dryYieldPercentage: z.number().min(0).max(100).optional(),
  harvestMethod: z.enum(['filtration', 'centrifuge', 'screen']).optional().default('filtration'),
  notes: z.string().optional(),
});

export const createProductionSchema = z.object({
  harvestId: z.number().int().positive().optional(),
  productionDate: z.string().min(1, 'Production date is required'),
  wetInputKg: z.number().positive('Wet input weight is required'),
  outputType: z.enum(['powder', 'wet', 'both']).optional().default('powder'),
  wetOutputKg: z.number().min(0).optional().default(0),
  dryerType: z.enum(['solar', 'tray', 'spray', 'drum', 'none']).optional(),
  dryingTimeHours: z.number().min(0).optional(),
  finalMoisturePct: z.number().min(0).max(100).optional(),
  powderOutputKg: z.number().min(0).optional().default(0),
  batchId: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type CreateHarvestInput = z.infer<typeof createHarvestSchema>;
export type CreateProductionInput = z.infer<typeof createProductionSchema>;
