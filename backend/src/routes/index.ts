import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { createEventValidator, eventQueryValidator } from '../validators/event.validator';
import { eventController } from '../controllers/event.controller';
import { registrationController } from '../controllers/registration.controller';
import { attendanceController } from '../controllers/attendance.controller';
import {
  certificateController,
  feedbackController,
  notificationController,
  analyticsController,
  userController,
  wishlistController,
  venueController,
  categoryController,
  departmentController,
  auditController,
  volunteerController,
  speakerController,
  sessionController,
  recommendationController,
  reportController,
} from '../controllers/index.controller';

const router = Router();

// ─── Events ───────────────────────────────────────────────────────────────────
router.get('/events', optionalAuth, eventQueryValidator, validate, eventController.getAll);
router.get('/events/:id', optionalAuth, eventController.getById);
router.post('/events', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'), upload.single('bannerImage'), createEventValidator, validate, eventController.create);
router.put('/events/:id', authenticate, upload.single('bannerImage'), eventController.update);
router.post('/events/:id/submit', authenticate, eventController.submitForApproval);
router.post('/events/:id/review', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR'), eventController.review);
router.post('/events/:id/publish', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'), eventController.publish);
router.post('/events/:id/cancel', authenticate, eventController.cancel);
router.get('/events/:id/stats', authenticate, eventController.getStats);
router.get('/events/:id/approval-history', authenticate, eventController.getApprovalHistory);

// ─── Registrations ────────────────────────────────────────────────────────────
router.post('/events/:eventId/register', authenticate, authorize('STUDENT', 'FACULTY_COORDINATOR'), registrationController.register);
router.delete('/events/:eventId/register', authenticate, registrationController.cancel);
router.get('/events/:eventId/participants', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER', 'VOLUNTEER'), registrationController.getEventParticipants);
router.get('/registrations/me', authenticate, registrationController.getMyRegistrations);
router.get('/registrations/:registrationId/qr', authenticate, registrationController.getQRCode);

// ─── Attendance ───────────────────────────────────────────────────────────────
router.post('/attendance/qr-checkin', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER', 'VOLUNTEER'), attendanceController.checkInByQR);
router.post('/attendance/manual-checkin', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER', 'VOLUNTEER'), attendanceController.checkInManual);
router.post('/attendance/checkout', authenticate, attendanceController.checkOut);
router.get('/events/:eventId/attendance', authenticate, attendanceController.getEventAttendance);
router.put('/attendance/:attendanceId', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN'), attendanceController.correctAttendance);

// ─── Certificates ─────────────────────────────────────────────────────────────
router.post('/events/:eventId/certificates/generate', authenticate, certificateController.generate);
router.post('/events/:eventId/certificates/generate-bulk', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'), certificateController.generateBulk);
router.get('/certificates/me', authenticate, certificateController.getMyCertificates);
router.get('/certificates/verify/:token', certificateController.verify);

// ─── Feedback ─────────────────────────────────────────────────────────────────
router.post('/events/:eventId/feedback', authenticate, authorize('STUDENT', 'FACULTY_COORDINATOR'), feedbackController.submit);
router.get('/events/:eventId/feedback', authenticate, feedbackController.getEventFeedback);

// ─── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications', authenticate, notificationController.getAll);
router.get('/notifications/unread-count', authenticate, notificationController.getUnreadCount);
router.put('/notifications/:id/read', authenticate, notificationController.markRead);
router.put('/notifications/mark-all-read', authenticate, notificationController.markAllRead);

// ─── Dashboard & Analytics ────────────────────────────────────────────────────
router.get('/dashboard/admin', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN'), analyticsController.superAdminDashboard);
router.get('/dashboard/organizer', authenticate, analyticsController.organizerDashboard);
router.get('/events/:eventId/performance', authenticate, analyticsController.eventPerformance);

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users/me', authenticate, userController.getProfile);
router.put('/users/me', authenticate, upload.single('avatar'), userController.updateProfile);
router.get('/users', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN'), userController.getAllUsers);
router.put('/users/:id/toggle-status', authenticate, authorize('SUPER_ADMIN'), userController.toggleUserStatus);

// ─── Wishlist ─────────────────────────────────────────────────────────────────
router.post('/wishlist/:eventId', authenticate, wishlistController.add);
router.delete('/wishlist/:eventId', authenticate, wishlistController.remove);
router.get('/wishlist', authenticate, wishlistController.getAll);

// ─── Venues ───────────────────────────────────────────────────────────────────
router.get('/venues', venueController.getAll);
router.post('/venues', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN'), venueController.create);
router.put('/venues/:id', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN'), venueController.update);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', categoryController.getAll);
router.post('/categories', authenticate, authorize('SUPER_ADMIN'), categoryController.create);

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments', departmentController.getAll);
router.post('/departments', authenticate, authorize('SUPER_ADMIN'), departmentController.create);

// ─── Volunteers ───────────────────────────────────────────────────────────────
router.post('/events/:eventId/volunteers/apply', authenticate, volunteerController.apply);
router.put('/volunteers/:id/approve', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'), volunteerController.approve);
router.post('/volunteers/:volunteerId/tasks', authenticate, volunteerController.assignTask);
router.put('/volunteers/tasks/:taskId', authenticate, volunteerController.updateTaskStatus);
router.get('/events/:eventId/volunteers', authenticate, volunteerController.getEventVolunteers);

// ─── Speakers ─────────────────────────────────────────────────────────────────
router.get('/speakers', speakerController.getAll);
router.post('/speakers', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN'), upload.single('photo'), speakerController.create);
router.post('/events/:eventId/speakers', authenticate, speakerController.assignToEvent);

// ─── Sessions ─────────────────────────────────────────────────────────────────
router.get('/events/:eventId/sessions', sessionController.getEventSessions);
router.post('/events/:eventId/sessions', authenticate, sessionController.create);
router.put('/events/:eventId/sessions/:sessionId', authenticate, sessionController.update);
router.delete('/events/:eventId/sessions/:sessionId', authenticate, sessionController.delete);

// ─── Recommendations ──────────────────────────────────────────────────────────
router.get('/recommendations', authenticate, recommendationController.getRecommendations);

// ─── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports/events/:eventId/registrations', authenticate, authorize('SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'), reportController.exportRegistrations);

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN'), auditController.getAll);

export default router;
