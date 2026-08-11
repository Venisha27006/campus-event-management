import { Response } from 'express';
import { PaginationMeta } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta
) => {
  res
    .status(statusCode)
    .json(
      meta === undefined
        ? { success: true, message, data }
        : { success: true, message, data, meta }
    );
};

export const sendError = (res: Response, message: string, statusCode = 400, errors?: unknown) => {
  res
    .status(statusCode)
    .json(
      errors === undefined
        ? { success: false, message }
        : { success: false, message, errors }
    );
};

export const paginate = (page: number, limit: number, total: number): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});

export const getPaginationParams = (pageStr?: string, limitStr?: string) => {
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
