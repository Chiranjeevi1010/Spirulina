import { Router } from 'express';
import { WaterParametersController } from './water-parameters.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createWaterParameterSchema } from '@spirulina/shared';

const router = Router();
const controller = new WaterParametersController();

router.use(authenticate);

// GET /api/v1/water-parameters/alerts - Get all active parameter alerts
router.get('/alerts', authorize('water_params', 'read'), controller.getAlerts);

// GET /api/v1/water-parameters/:pondId/readings - List readings for a pond
router.get('/:pondId/readings', authorize('water_params', 'read'), controller.list);

// GET /api/v1/water-parameters/:pondId/readings/latest - Get latest reading for a pond
router.get('/:pondId/readings/latest', authorize('water_params', 'read'), controller.getLatest);

// GET /api/v1/water-parameters/:pondId/readings/trends - Get trend data for charts
router.get('/:pondId/readings/trends', authorize('water_params', 'read'), controller.getTrends);

// GET /api/v1/water-parameters/:pondId/readings/:id - Get single reading
router.get('/:pondId/readings/:id', authorize('water_params', 'read'), controller.getById);

// POST /api/v1/water-parameters/:pondId/readings - Create new reading
router.post(
  '/:pondId/readings',
  authorize('water_params', 'write'),
  validate(createWaterParameterSchema),
  controller.create,
);

// PUT /api/v1/water-parameters/:pondId/readings/:id - Update reading
router.put('/:pondId/readings/:id', authorize('water_params', 'write'), controller.update);

// DELETE /api/v1/water-parameters/:pondId/readings/:id - Delete reading
router.delete('/:pondId/readings/:id', authorize('water_params', 'delete'), controller.delete);

export default router;
