import { Response } from 'express';
import type { ApiResponse, PaginatedResponse, PaginationMeta } from '@spirulina/shared';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully') {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string,
) {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    meta,
    message,
  };
  return res.status(200).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: { field: string; message: string }[],
) {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
}

export function sendNotFound(res: Response, entity = 'Resource') {
  return sendError(res, `${entity} not found`, 404);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized') {
  return sendError(res, message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden') {
  return sendError(res, message, 403);
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
