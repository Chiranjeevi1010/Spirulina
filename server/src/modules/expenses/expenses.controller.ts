import { Request, Response, NextFunction } from 'express';
import { ExpensesService } from './expenses.service.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../utils/api-response.util.js';

const expensesService = new ExpensesService();

export class ExpensesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const filters = {
        categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
        status: req.query.status as string | undefined,
        pondId: req.query.pondId ? Number(req.query.pondId) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        search: req.query.search as string | undefined,
      };
      const { data, total } = await expensesService.list(page, limit, filters);
      sendPaginated(res, data, buildPaginationMeta(page, limit, total));
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.getById(Number(req.params.id));
      sendSuccess(res, expense);
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.create(req.body, req.user?.userId);
      sendCreated(res, expense, 'Expense recorded');
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.update(Number(req.params.id), req.body);
      sendSuccess(res, expense, 'Expense updated');
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await expensesService.delete(Number(req.params.id));
      sendSuccess(res, null, 'Expense deleted');
    } catch (err) { next(err); }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.approve(Number(req.params.id), req.user!.userId);
      sendSuccess(res, expense, 'Expense approved');
    } catch (err) { next(err); }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expensesService.reject(Number(req.params.id), req.user!.userId);
      sendSuccess(res, expense, 'Expense rejected');
    } catch (err) { next(err); }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await expensesService.getCategories();
      sendSuccess(res, categories);
    } catch (err) { next(err); }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await expensesService.createCategory(req.body);
      sendCreated(res, category, 'Category created');
    } catch (err) { next(err); }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await expensesService.getSummary(
        req.query.startDate as string | undefined,
        req.query.endDate as string | undefined,
      );
      sendSuccess(res, summary);
    } catch (err) { next(err); }
  }
}
