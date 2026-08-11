import { Response, NextFunction } from 'express';
import { AuthRequest, param } from '../types';
import { certificateService } from '../services/certificate.service';
import { feedbackService } from '../services/feedback.service';
import { notificationService } from '../services/notification.service';
import { analyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/response';
import { prisma } from '../config/prisma';
import { NotFoundError } from '../utils/errors';
import { sanitizeUser } from '../utils/helpers';
import { getPaginationParams, paginate } from '../utils/response';

// ─── Certificate Controller ───────────────────────────────────────────────────

export const certificateController = {
  async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cert = await certificateService.generate(param(req.params.eventId), req.user!.userId);
      sendSuccess(res, cert, 'Certificate generated', 201);
    } catch (err) { next(err); }
  },

  async generateBulk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await certificateService.generateBulk(param(req.params.eventId), req.user!.userId);
      sendSuccess(res, result, 'Bulk certificate generation complete');
    } catch (err) { next(err); }
  },

  async verify(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raw = await certificateService.verify(param(req.params.token), req.ip);
      if (!raw.valid) { sendSuccess(res, null, 'Invalid certificate', 404); return; }
      const cert = await prisma.certificate.findUnique({
        where: { verifyToken: param(req.params.token) },
        select: { id: true },
      });
      const verificationCount = cert
        ? await prisma.certificateVerification.count({ where: { certificateId: cert.id } })
        : 0;
      sendSuccess(res, {
        certificateId: raw.certificateId,
        participantName: raw.participantName,
        eventName: raw.eventName,
        issuedAt: raw.issuedAt,
        verificationCount,
        valid: raw.valid,
      }, 'Certificate verification complete');
    } catch (err) { next(err); }
  },

  async getMyCertificates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const certs = await certificateService.getUserCertificates(req.user!.userId);
      sendSuccess(res, certs, 'Certificates retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Feedback Controller ──────────────────────────────────────────────────────

export const feedbackController = {
  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const feedback = await feedbackService.submit(param(req.params.eventId), req.user!.userId, req.body as never);
      sendSuccess(res, feedback, 'Feedback submitted', 201);
    } catch (err) { next(err); }
  },

  async getEventFeedback(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await feedbackService.getEventFeedback(param(req.params.eventId));
      sendSuccess(res, result, 'Feedback retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Notification Controller ──────────────────────────────────────────────────

export const notificationController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getUserNotifications(
        req.user!.userId,
        req.query.page as string,
        req.query.limit as string,
      );
      sendSuccess(res, result.notifications, 'Notifications retrieved', 200, result.meta);
    } catch (err) { next(err); }
  },

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markRead(param(req.params.id), req.user!.userId);
      sendSuccess(res, null, 'Notification marked as read');
    } catch (err) { next(err); }
  },

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllRead(req.user!.userId);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (err) { next(err); }
  },

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.userId);
      sendSuccess(res, { count }, 'Unread count retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Analytics Controller ─────────────────────────────────────────────────────

export const analyticsController = {
  async superAdminDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raw = await analyticsService.getSuperAdminDashboard();
      const upcomingEvents = await prisma.event.findMany({
        where: {
          startDate: { gte: new Date() },
          status: { in: ['REGISTRATION_OPEN', 'APPROVED', 'PUBLISHED'] },
        },
        include: { category: true },
        orderBy: { startDate: 'asc' },
        take: 5,
      });
      sendSuccess(res, { ...raw.overview, ...raw.charts, upcomingEvents }, 'Dashboard data retrieved');
    } catch (err) { next(err); }
  },

  async organizerDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raw = await analyticsService.getOrganizerDashboard(req.user!.userId);
      const avgAttendanceRate = raw.events.length > 0
        ? Math.round(raw.events.reduce((s: number, e: { attendanceRate: number }) => s + e.attendanceRate, 0) / raw.events.length * 10) / 10
        : 0;
      sendSuccess(res, {
        ...raw.overview,
        recentEvents: raw.events.slice(0, 5),
        avgAttendanceRate,
        avgFeedbackScore: raw.overview.avgFeedbackRating
          ? Math.round(raw.overview.avgFeedbackRating * 10) / 10
          : null,
      }, 'Dashboard data retrieved');
    } catch (err) { next(err); }
  },

  async eventPerformance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const raw = await analyticsService.getEventPerformanceScore(param(req.params.eventId));
      if (!raw) { sendSuccess(res, null, 'No data'); return; }
      sendSuccess(res, {
        score: raw.score,
        registrationRate: raw.breakdown.registrationFill,
        attendanceRate: raw.breakdown.attendanceRate,
        feedbackScore: raw.breakdown.avgFeedback,
        completionRate: raw.breakdown.attendanceRate,
      }, 'Performance score retrieved');
    } catch (err) { next(err); }
  },
};

// ─── User Controller ──────────────────────────────────────────────────────────

export const userController = {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { department: true },
      });
      if (!user) throw new NotFoundError('User');
      sendSuccess(res, sanitizeUser(user), 'Profile retrieved');
    } catch (err) { next(err); }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, phone, academicYear, rollNumber, departmentId } = req.body as Record<string, string>;
      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          firstName,
          lastName,
          phone,
          academicYear: academicYear ? parseInt(academicYear) : undefined,
          rollNumber,
          departmentId: departmentId || undefined,
          avatar: req.file?.path,
        },
        include: { department: true },
      });
      sendSuccess(res, sanitizeUser(user), 'Profile updated');
    } catch (err) { next(err); }
  },

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(
        req.query.page as string,
        req.query.limit as string,
      );
      const search = req.query.search as string | undefined;
      const where = search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};
      const [users, total] = await Promise.all([
        prisma.user.findMany({ where, include: { department: true }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.user.count({ where }),
      ]);
      sendSuccess(res, users.map(sanitizeUser), 'Users retrieved', 200, paginate(page, limit, total));
    } catch (err) { next(err); }
  },

  async toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({ where: { id: param(req.params.id) } });
      if (!user) throw new NotFoundError('User');
      const updated = await prisma.user.update({
        where: { id: param(req.params.id) },
        data: { isActive: !user.isActive },
      });
      sendSuccess(res, sanitizeUser(updated), `User ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) { next(err); }
  },
};

// ─── Wishlist Controller ──────────────────────────────────────────────────────

export const wishlistController = {
  async add(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.wishlist.upsert({
        where: { userId_eventId: { userId: req.user!.userId, eventId: param(req.params.eventId) } },
        create: { userId: req.user!.userId, eventId: param(req.params.eventId) },
        update: {},
      });
      sendSuccess(res, null, 'Added to wishlist');
    } catch (err) { next(err); }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.wishlist.deleteMany({
        where: { userId: req.user!.userId, eventId: param(req.params.eventId) },
      });
      sendSuccess(res, null, 'Removed from wishlist');
    } catch (err) { next(err); }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const wishlists = await prisma.wishlist.findMany({
        where: { userId: req.user!.userId },
        include: { event: { include: { category: true, venue: true, department: true } } },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, wishlists, 'Wishlist retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Venue Controller ─────────────────────────────────────────────────────────

export const venueController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const venue = await prisma.venue.create({ data: req.body as never });
      sendSuccess(res, venue, 'Venue created', 201);
    } catch (err) { next(err); }
  },

  async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const venues = await prisma.venue.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
      sendSuccess(res, venues, 'Venues retrieved');
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const venue = await prisma.venue.update({ where: { id: param(req.params.id) }, data: req.body as never });
      sendSuccess(res, venue, 'Venue updated');
    } catch (err) { next(err); }
  },
};

// ─── Category Controller ──────────────────────────────────────────────────────

export const categoryController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description, color, icon } = req.body as Record<string, string>;
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const cat = await prisma.eventCategory.create({ data: { name, slug, description, color, icon } });
      sendSuccess(res, cat, 'Category created', 201);
    } catch (err) { next(err); }
  },

  async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cats = await prisma.eventCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
      sendSuccess(res, cats, 'Categories retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Department Controller ────────────────────────────────────────────────────

export const departmentController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dept = await prisma.department.create({ data: req.body as never });
      sendSuccess(res, dept, 'Department created', 201);
    } catch (err) { next(err); }
  },

  async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const depts = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
      sendSuccess(res, depts, 'Departments retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Audit Log Controller ─────────────────────────────────────────────────────

export const auditController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPaginationParams(
        req.query.page as string,
        req.query.limit as string,
      );
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count(),
      ]);
      sendSuccess(res, logs, 'Audit logs retrieved', 200, paginate(page, limit, total));
    } catch (err) { next(err); }
  },
};

// ─── Volunteer Controller ─────────────────────────────────────────────────────

export const volunteerController = {
  async apply(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vol = await prisma.volunteer.create({
        data: {
          eventId: param(req.params.eventId),
          userId: req.user!.userId,
          notes: (req.body as { notes?: string }).notes,
        },
      });
      sendSuccess(res, vol, 'Volunteer application submitted', 201);
    } catch (err) { next(err); }
  },

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vol = await prisma.volunteer.update({
        where: { id: param(req.params.id) },
        data: { status: 'APPROVED', approvedAt: new Date() },
      });
      sendSuccess(res, vol, 'Volunteer approved');
    } catch (err) { next(err); }
  },

  async assignTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = req.body as { title: string; description?: string; shiftStart?: string; shiftEnd?: string };
      const task = await prisma.volunteerTask.create({
        data: {
          volunteerId: param(req.params.volunteerId),
          title: body.title,
          description: body.description,
          shiftStart: body.shiftStart ? new Date(body.shiftStart) : undefined,
          shiftEnd: body.shiftEnd ? new Date(body.shiftEnd) : undefined,
        },
      });
      sendSuccess(res, task, 'Task assigned', 201);
    } catch (err) { next(err); }
  },

  async updateTaskStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await prisma.volunteerTask.update({
        where: { id: param(req.params.taskId) },
        data: { status: (req.body as { status: string }).status as never },
      });
      sendSuccess(res, task, 'Task status updated');
    } catch (err) { next(err); }
  },

  async getEventVolunteers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vols = await prisma.volunteer.findMany({
        where: { eventId: param(req.params.eventId) },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          tasks: true,
        },
      });
      sendSuccess(res, vols, 'Volunteers retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Speaker Controller ───────────────────────────────────────────────────────

export const speakerController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { expertise, name, designation, organization, bio, email, linkedinUrl } =
        req.body as {
          name: string; expertise?: string; designation?: string;
          organization?: string; bio?: string; email?: string; linkedinUrl?: string;
        };
      const speaker = await prisma.speaker.create({
        data: {
          name,
          designation,
          organization,
          bio,
          email,
          linkedinUrl,
          photo: req.file?.path,
          expertise: expertise ? expertise.split(',').map((e) => e.trim()).filter(Boolean) : [],
        },
      });
      sendSuccess(res, speaker, 'Speaker created', 201);
    } catch (err) { next(err); }
  },

  async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const speakers = await prisma.speaker.findMany({ orderBy: { name: 'asc' } });
      sendSuccess(res, speakers, 'Speakers retrieved');
    } catch (err) { next(err); }
  },

  async assignToEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { speakerId, role } = req.body as { speakerId: string; role?: string };
      const es = await prisma.eventSpeaker.create({
        data: { eventId: param(req.params.eventId), speakerId, role },
      });
      sendSuccess(res, es, 'Speaker assigned', 201);
    } catch (err) { next(err); }
  },
};

// ─── Session Controller ───────────────────────────────────────────────────────

export const sessionController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = req.body as {
        title: string; description?: string;
        startTime: string; endTime: string;
        speakerId?: string; location?: string;
        sessionType?: string; order?: number;
      };
      const session = await prisma.eventSession.create({
        data: {
          eventId: param(req.params.eventId),
          title: body.title,
          description: body.description,
          startTime: new Date(body.startTime),
          endTime: new Date(body.endTime),
          speakerId: body.speakerId || undefined,
          location: body.location,
          sessionType: body.sessionType ?? 'TALK',
          order: body.order ?? 0,
        },
      });
      sendSuccess(res, session, 'Session created', 201);
    } catch (err) { next(err); }
  },

  async getEventSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await prisma.eventSession.findMany({
        where: { eventId: param(req.params.eventId) },
        include: { speaker: true },
        orderBy: { order: 'asc' },
      });
      sendSuccess(res, sessions, 'Sessions retrieved');
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const session = await prisma.eventSession.update({
        where: { id: param(req.params.sessionId) },
        data: req.body as never,
      });
      sendSuccess(res, session, 'Session updated');
    } catch (err) { next(err); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await prisma.eventSession.delete({ where: { id: param(req.params.sessionId) } });
      sendSuccess(res, null, 'Session deleted');
    } catch (err) { next(err); }
  },
};

// ─── Recommendation Controller ────────────────────────────────────────────────

export const recommendationController = {
  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true, academicYear: true },
      });

      const registeredEvents = await prisma.registration.findMany({
        where: { userId },
        include: { event: { select: { categoryId: true } } },
      });
      const preferredCategories = [...new Set(registeredEvents.map((r: { event: { categoryId: string } }) => r.event.categoryId))];

      const wishlisted = await prisma.wishlist.findMany({
        where: { userId },
        include: { event: { select: { categoryId: true } } },
      });
      const allPreferred = [...new Set([
        ...preferredCategories,
        ...wishlisted.map((w: { event: { categoryId: string } }) => w.event.categoryId),
      ])];

      const registeredEventIds = registeredEvents.map((r: { eventId: string }) => r.eventId);

      const recommended = await prisma.event.findMany({
        where: {
          id: { notIn: registeredEventIds },
          status: 'REGISTRATION_OPEN',
          OR: [
            ...(allPreferred.length ? [{ categoryId: { in: allPreferred } }] : []),
            ...(user?.departmentId ? [{ departmentId: user.departmentId }] : []),
            ...(user?.academicYear ? [{ requiredYear: user.academicYear }] : []),
          ],
        },
        include: { category: true, venue: true, department: true },
        orderBy: { viewCount: 'desc' },
        take: 10,
      });

      sendSuccess(res, recommended, 'Recommendations retrieved');
    } catch (err) { next(err); }
  },
};

// ─── Report Controller ────────────────────────────────────────────────────────

export const reportController = {
  async exportRegistrations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const eventId = param(req.params.eventId);
      const registrations = await prisma.registration.findMany({
        where: { eventId },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, rollNumber: true } },
          attendance: true,
        },
      });

      const rows = registrations.map((r: {
        user: { firstName: string; lastName: string; email: string; phone: string | null; rollNumber: string | null };
        status: string; registeredAt: Date;
        attendance: { checkInTime: Date | null } | null;
      }) => ({
        Name: `${r.user.firstName} ${r.user.lastName}`,
        Email: r.user.email,
        Phone: r.user.phone ?? '',
        RollNumber: r.user.rollNumber ?? '',
        Status: r.status,
        RegisteredAt: r.registeredAt.toISOString(),
        CheckedIn: r.attendance?.checkInTime ? 'Yes' : 'No',
        CheckInTime: r.attendance?.checkInTime?.toISOString() ?? '',
      }));

      const header = Object.keys(rows[0] ?? {}).join(',');
      const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="registrations-${eventId}.csv"`);
      res.send(csv);
    } catch (err) { next(err); }
  },
};
