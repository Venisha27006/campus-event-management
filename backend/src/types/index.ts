import { UserRole } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Express 5 types params as Record<string, string | string[]>
// This helper coerces a single param to string safely
export const param = (v: string | string[] | undefined): string => {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
};

export interface AuthRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export interface EventFilters {
  search?: string;
  categoryId?: string;
  departmentId?: string;
  eventType?: string;
  eventMode?: string;
  startDate?: string;
  endDate?: string;
  isFree?: string;
  hasAvailability?: string;
  status?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
