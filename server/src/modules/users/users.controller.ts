import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const usersService = new UsersService();

export class UsersController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const search = req.query.search as string | undefined;

      const { data, total } = await usersService.list(page, limit, search);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = await usersService.getById(id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.create(req.body);
      sendCreated(res, user, 'User created successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = await usersService.update(id, req.body);
      sendSuccess(res, user, 'User updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body;
      const user = await usersService.updateStatus(id, isActive);
      sendSuccess(res, user, `User ${isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      next(err);
    }
  }

  async listRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const rolesList = await usersService.listRoles();
      sendSuccess(res, rolesList);
    } catch (err) {
      next(err);
    }
  }
}
