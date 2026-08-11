import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { createAuditLog } from '../utils/audit';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      sendSuccess(res, user, 'Registration successful. Please verify your email.', 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req.headers['user-agent'], req.ip);
      await createAuditLog({ userId: result.user.id, action: 'LOGIN', module: 'AUTH', req });
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      if (req.user) await createAuditLog({ userId: req.user.userId, action: 'LOGOUT', module: 'AUTH', req });
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logoutAll(req.user!.userId);
      sendSuccess(res, null, 'Logged out from all devices');
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.verifyEmail(req.query.token as string);
      sendSuccess(res, null, 'Email verified successfully');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, 'If this email exists, a reset link has been sent.');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },

  async getSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await authService.getSessions(req.user!.userId);
      sendSuccess(res, sessions, 'Sessions retrieved');
    } catch (err) {
      next(err);
    }
  },
};
