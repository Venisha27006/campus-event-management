import { Response, NextFunction } from 'express';
import { AuthRequest, param } from '../types';
import { registrationService } from '../services/registration.service';
import { sendSuccess } from '../utils/response';

export const registrationController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await registrationService.register(param(req.params.eventId), req.user!.userId);
      const msg = result.waitlisted
        ? `Added to waitlist at position #${result.waitlistPosition}`
        : 'Registration confirmed';
      sendSuccess(res, result, msg, 201);
    } catch (err) { next(err); }
  },

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await registrationService.cancel(param(req.params.eventId), req.user!.userId);
      sendSuccess(res, null, 'Registration cancelled');
    } catch (err) { next(err); }
  },

  async getQRCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await registrationService.getQRCode(param(req.params.registrationId), req.user!.userId);
      sendSuccess(res, result, 'QR code retrieved');
    } catch (err) { next(err); }
  },

  async getMyRegistrations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await registrationService.getUserRegistrations(
        req.user!.userId,
        req.query.page as string,
        req.query.limit as string,
      );
      sendSuccess(res, result.registrations, 'Registrations retrieved', 200, result.meta);
    } catch (err) { next(err); }
  },

  async getEventParticipants(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await registrationService.getEventParticipants(
        param(req.params.eventId),
        req.query.page as string,
        req.query.limit as string,
      );
      sendSuccess(res, result.registrations, 'Participants retrieved', 200, result.meta);
    } catch (err) { next(err); }
  },
};
