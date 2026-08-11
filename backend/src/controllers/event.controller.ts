import { Response, NextFunction } from 'express';
import { AuthRequest, param } from '../types';
import { eventService } from '../services/event.service';
import { sendSuccess } from '../utils/response';
import { createAuditLog } from '../utils/audit';
import { UserRole } from '@prisma/client';

export const eventController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.create({
        ...req.body,
        organizerId: req.user!.userId,
        bannerImage: req.file?.path,
      });
      await createAuditLog({ userId: req.user!.userId, action: 'CREATE_EVENT', module: 'EVENT', entityId: event.id, req });
      sendSuccess(res, event, 'Event created successfully', 201);
    } catch (err) { next(err); }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await eventService.findAll(req.query as never, req.user?.userId);
      sendSuccess(res, result.events, 'Events retrieved', 200, result.meta);
    } catch (err) { next(err); }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.findById(param(req.params.id), req.user?.userId);
      sendSuccess(res, event, 'Event retrieved');
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.update(
        param(req.params.id),
        req.user!.userId,
        req.user!.role as UserRole,
        req.body,
      );
      await createAuditLog({ userId: req.user!.userId, action: 'UPDATE_EVENT', module: 'EVENT', entityId: event.id, req });
      sendSuccess(res, event, 'Event updated');
    } catch (err) { next(err); }
  },

  async submitForApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.submitForApproval(param(req.params.id), req.user!.userId, req.user!.role as UserRole);
      sendSuccess(res, event, 'Event submitted for approval');
    } catch (err) { next(err); }
  },

  async review(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { decision, comments, rejectionReason } = req.body;
      const event = await eventService.reviewEvent(
        param(req.params.id),
        req.user!.userId,
        req.user!.role as UserRole,
        decision,
        comments,
        rejectionReason,
      );
      sendSuccess(res, event, `Event ${(decision as string).toLowerCase()}`);
    } catch (err) { next(err); }
  },

  async publish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const event = await eventService.publish(param(req.params.id), req.user!.userId, req.user!.role as UserRole);
      sendSuccess(res, event, 'Event published');
    } catch (err) { next(err); }
  },

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await eventService.cancel(param(req.params.id), req.user!.userId, req.user!.role as UserRole, req.body.reason);
      sendSuccess(res, null, 'Event cancelled');
    } catch (err) { next(err); }
  },

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await eventService.getStats(param(req.params.id));
      sendSuccess(res, stats, 'Event stats retrieved');
    } catch (err) { next(err); }
  },

  async getApprovalHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const history = await eventService.getApprovalHistory(param(req.params.id));
      sendSuccess(res, history, 'Approval history retrieved');
    } catch (err) { next(err); }
  },
};
