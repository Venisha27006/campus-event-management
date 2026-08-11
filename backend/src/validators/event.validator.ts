import { body, query } from 'express-validator';

export const createEventValidator = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('categoryId').isUUID().withMessage('Valid category ID required'),
  body('eventType').notEmpty().withMessage('Event type required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('maxCapacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('registrationDeadline').isISO8601().withMessage('Valid registration deadline required'),
  body('registrationFee').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Invalid fee format'),
];

export const eventQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];
