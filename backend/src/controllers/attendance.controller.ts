import { Response, NextFunction } from 'express';
import { AuthRequest, param } from '../types';
import { attendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/response';

export const attendanceController = {
  async checkInByQR(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.checkInByQR(req.body.qrData as string, req.user!.userId);
      sendSuccess(res, result, 'Check-in successful');
    } catch (err) { next(err); }
  },

  async checkInManual(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.checkInManual(req.body.registrationId as string, req.user!.userId);
      sendSuccess(res, result, 'Check-in successful');
    } catch (err) { next(err); }
  },

  async checkOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.checkOut(req.body.registrationId as string, req.user!.userId);
      sendSuccess(res, result, 'Check-out successful');
    } catch (err) { next(err); }
  },

  async getEventAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.getEventAttendance(param(req.params.eventId));
      sendSuccess(res, result, 'Attendance retrieved');
    } catch (err) { next(err); }
  },

  async correctAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.correctAttendance(
        param(req.params.attendanceId),
        req.body as { checkInTime?: Date; checkOutTime?: Date; notes?: string },
        req.user!.userId,
      );
      sendSuccess(res, result, 'Attendance corrected');
    } catch (err) { next(err); }
  },
};
