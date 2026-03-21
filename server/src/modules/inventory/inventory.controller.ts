import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.util.js';

const inventoryService = new InventoryService();

export class InventoryController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await inventoryService.list();
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.getById(Number(req.params.id));
      sendSuccess(res, item);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.create(req.body);
      sendCreated(res, item, 'Inventory item created');
    } catch (err) { next(err); }
  }

  async updateQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.updateQuantity(Number(req.params.id), req.body.quantity);
      sendSuccess(res, item, 'Quantity updated');
    } catch (err) { next(err); }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryService.update(Number(req.params.id), req.body);
      sendSuccess(res, item, 'Inventory item updated');
    } catch (err) { next(err); }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      await inventoryService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Inventory item deleted');
    } catch (err) { next(err); }
  }
}
