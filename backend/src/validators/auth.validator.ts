import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('role').optional().isIn(['STUDENT', 'FACULTY_COORDINATOR', 'SPEAKER']).withMessage('Invalid role'),
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];
