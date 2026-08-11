import { prisma } from '../config/prisma';
import { EventStatus, ApprovalStatus, UserRole, Prisma } from '@prisma/client';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors';
import { generateSlug } from '../utils/helpers';
import { getPaginationParams, paginate } from '../utils/response';
import { EventFilters } from '../types';
import { notificationService } from './notification.service';

interface CreateEventInput {
  title: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  eventType: string;
  eventMode?: string;
  departmentId?: string;
  organizerId: string;
  facultyCoordinatorId?: string;
  bannerImage?: string;
  startDate: string;
  endDate: string;
  venueId?: string;
  onlineMeetingUrl?: string;
  maxCapacity: number;
  registrationDeadline: string;
  eligibilityCriteria?: string;
  requiredDepartmentId?: string;
  requiredYear?: number;
  registrationFee?: number;
  paymentRequired?: boolean;
  instructions?: string;
  contactEmail?: string;
  contactPhone?: string;
  tags?: string[];
}

export const eventService = {
  async create(data: CreateEventInput) {
    const slug = generateSlug(data.title);

    // Validate dates
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const deadline = new Date(data.registrationDeadline);
    if (end <= start) throw new AppError('End date must be after start date');
    if (deadline >= start) throw new AppError('Registration deadline must be before event start');

    // Venue conflict check
    if (data.venueId) {
      await checkVenueConflict(data.venueId, start, end);
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        categoryId: data.categoryId,
        eventType: data.eventType as never,
        eventMode: (data.eventMode as never) || 'OFFLINE',
        departmentId: data.departmentId,
        organizerId: data.organizerId,
        facultyCoordinatorId: data.facultyCoordinatorId,
        bannerImage: data.bannerImage,
        startDate: start,
        endDate: end,
        venueId: data.venueId,
        onlineMeetingUrl: data.onlineMeetingUrl,
        maxCapacity: data.maxCapacity,
        registrationDeadline: deadline,
        eligibilityCriteria: data.eligibilityCriteria,
        requiredDepartmentId: data.requiredDepartmentId,
        requiredYear: data.requiredYear,
        registrationFee: data.registrationFee || 0,
        paymentRequired: data.paymentRequired || false,
        instructions: data.instructions,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        tags: data.tags?.length
          ? {
              create: data.tags.map((tagId) => ({ tag: { connect: { id: tagId } } })),
            }
          : undefined,
      },
      include: eventInclude,
    });

    return event;
  },

  async findAll(filters: EventFilters, userId?: string) {
    const { page, limit, skip } = getPaginationParams(filters.page, filters.limit);

    const where: Prisma.EventWhereInput = buildEventWhere(filters);

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          ...eventInclude,
          wishlists: userId ? { where: { userId } } : false,
          _count: { select: { registrations: true, waitlists: true } },
        },
        orderBy: buildOrderBy(filters.sortBy, filters.sortOrder),
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return { events, meta: paginate(page, limit, total) };
  },

  async findById(id: string, userId?: string) {
    const event = await prisma.event.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        ...eventInclude,
        sessions: { include: { speaker: true }, orderBy: { order: 'asc' } },
        speakers: { include: { speaker: true } },
        volunteers: { where: { status: 'ACTIVE' }, include: { user: { select: userSelect } } },
        wishlists: userId ? { where: { userId } } : false,
        _count: { select: { registrations: true, waitlists: true, feedbacks: true } },
      },
    });
    if (!event) throw new NotFoundError('Event');

    // Increment view count
    await prisma.event.update({ where: { id: event.id }, data: { viewCount: { increment: 1 } } });

    return event;
  },

async update(id: string, userId: string, userRole: UserRole, data: Partial<CreateEventInput>) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event');

    // Only organizer, admin, or super admin can edit
    if (
      event.organizerId !== userId &&
      userRole !== UserRole.SUPER_ADMIN &&
      userRole !== UserRole.EVENT_ADMIN
    ) {
      throw new ForbiddenError('You cannot edit this event');
    }

    // Cannot edit published/ongoing events without admin
    if (
      (event.status === EventStatus.ONGOING || event.status === EventStatus.COMPLETED) &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new AppError('Cannot edit a completed or ongoing event');
    }

    const updateData: Prisma.EventUpdateInput = { ...(data as Prisma.EventUpdateInput) };

    // If editing after rejection, reset approval status
    if (event.approvalStatus === ApprovalStatus.ADMIN_REJECTED || event.approvalStatus === ApprovalStatus.FACULTY_REJECTED) {
      updateData.approvalStatus = ApprovalStatus.PENDING;
      updateData.status = EventStatus.DRAFT;
    }

    if ((data as { venueId?: string }).venueId && (data as { startDate?: string }).startDate) {
      await checkVenueConflict(
        (data as { venueId: string }).venueId,
        new Date((data as { startDate: string }).startDate),
        new Date((data as { endDate: string }).endDate),
        id
      );
    }

    return prisma.event.update({ where: { id }, data: updateData, include: eventInclude });
  },

  async submitForApproval(id: string, userId: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event');
    if (event.organizerId !== userId) throw new ForbiddenError();
    if (event.status !== EventStatus.DRAFT) throw new AppError('Only draft events can be submitted for approval');

    return prisma.event.update({
      where: { id },
      data: { status: EventStatus.PENDING_APPROVAL, approvalStatus: ApprovalStatus.PENDING },
    });
  },

  async reviewEvent(
    id: string,
    reviewerId: string,
    reviewerRole: UserRole,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string,
    rejectionReason?: string
  ) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event');
    if (event.status !== EventStatus.PENDING_APPROVAL) throw new AppError('Event is not pending approval');

    const stage = reviewerRole === UserRole.FACULTY_COORDINATOR ? 'FACULTY_REVIEW' : 'ADMIN_REVIEW';

    await prisma.eventApproval.create({
      data: { eventId: id, reviewerId, stage, decision, comments, rejectionReason },
    });

    let newStatus: EventStatus;
    let newApproval: ApprovalStatus;

    if (decision === 'REJECTED') {
      newStatus = EventStatus.DRAFT;
      newApproval =
        reviewerRole === UserRole.FACULTY_COORDINATOR
          ? ApprovalStatus.FACULTY_REJECTED
          : ApprovalStatus.ADMIN_REJECTED;
    } else if (reviewerRole === UserRole.FACULTY_COORDINATOR) {
      newStatus = EventStatus.PENDING_APPROVAL;
      newApproval = ApprovalStatus.FACULTY_APPROVED;
    } else {
      newStatus = EventStatus.APPROVED;
      newApproval = ApprovalStatus.ADMIN_APPROVED;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: newStatus, approvalStatus: newApproval },
    });

    // Notify organizer
    const notifType = decision === 'APPROVED' ? 'EVENT_APPROVAL' : 'EVENT_REJECTION';
    const notifMsg =
      decision === 'APPROVED'
        ? `Your event "${event.title}" has been approved.`
        : `Your event "${event.title}" was rejected. Reason: ${rejectionReason || 'No reason provided'}`;

    await notificationService.create({
      userId: event.organizerId,
      eventId: id,
      type: notifType,
      title: decision === 'APPROVED' ? 'Event Approved' : 'Event Rejected',
      message: notifMsg,
    });

    return updated;
  },

  async publish(id: string, userId: string, userRole: UserRole) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event');
    if (event.approvalStatus !== ApprovalStatus.ADMIN_APPROVED) throw new AppError('Event must be approved before publishing');
    if (event.organizerId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.EVENT_ADMIN) {
      throw new ForbiddenError();
    }

    return prisma.event.update({
      where: { id },
      data: { status: EventStatus.REGISTRATION_OPEN },
    });
  },

  async cancel(id: string, userId: string, userRole: UserRole, reason?: string) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event');
    if (event.organizerId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.EVENT_ADMIN) {
      throw new ForbiddenError();
    }

    await prisma.event.update({ where: { id }, data: { status: EventStatus.CANCELLED } });

    // Notify all registered participants
    const registrations = await prisma.registration.findMany({
      where: { eventId: id, status: 'CONFIRMED' },
      select: { userId: true },
    });

    await notificationService.createBulk(
      registrations.map((r) => ({
        userId: r.userId,
        eventId: id,
        type: 'EVENT_CANCELLED' as const,
        title: 'Event Cancelled',
        message: `The event "${event.title}" has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      }))
    );
  },

  async getStats(id: string) {
    const [event, registrationCount, waitlistCount, attendanceCount, feedbackStats] = await Promise.all([
      prisma.event.findUnique({ where: { id }, select: { maxCapacity: true, title: true } }),
      prisma.registration.count({ where: { eventId: id, status: 'CONFIRMED' } }),
      prisma.waitlist.count({ where: { eventId: id, isActive: true } }),
      prisma.attendance.count({ where: { eventId: id, checkInTime: { not: null } } }),
      prisma.feedback.aggregate({
        where: { eventId: id },
        _avg: { overallRating: true, speakerRating: true, organizationRating: true },
        _count: true,
      }),
    ]);

    if (!event) throw new NotFoundError('Event');

    const available = Math.max(0, event.maxCapacity - registrationCount);
    const attendanceRate = registrationCount > 0 ? (attendanceCount / registrationCount) * 100 : 0;

    return {
      maxCapacity: event.maxCapacity,
      registered: registrationCount,
      available,
      waitlisted: waitlistCount,
      attended: attendanceCount,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      feedbackCount: feedbackStats._count,
      avgRating: feedbackStats._avg.overallRating,
    };
  },

  async getApprovalHistory(id: string) {
    return prisma.eventApproval.findMany({
      where: { eventId: id },
      include: { reviewer: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
  role: true,
};

const eventInclude = {
  category: true,
  department: true,
  organizer: { select: userSelect },
  facultyCoordinator: { select: userSelect },
  venue: true,
  tags: { include: { tag: true } },
};

const buildEventWhere = (filters: EventFilters): Prisma.EventWhereInput => {
  const where: Prisma.EventWhereInput = {};

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { shortDescription: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.eventType) where.eventType = filters.eventType as never;
  if (filters.eventMode) where.eventMode = filters.eventMode as never;

  if (filters.startDate || filters.endDate) {
    where.startDate = {};
    if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
  }

  if (filters.isFree === 'true') where.registrationFee = { equals: new Prisma.Decimal(0) };
  if (filters.isFree === 'false') where.registrationFee = { gt: new Prisma.Decimal(0) };

  if (filters.status) {
    where.status = filters.status as EventStatus;
  } else {
    // Default: show only public events
    where.status = { in: [EventStatus.REGISTRATION_OPEN, EventStatus.REGISTRATION_CLOSED, EventStatus.ONGOING, EventStatus.COMPLETED] };
    where.isPublic = true;
  }

  return where;
};

const buildOrderBy = (
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Prisma.EventOrderByWithRelationInput => {
  const order = sortOrder;
  switch (sortBy) {
    case 'popularity': return { viewCount: order };
    case 'newest': return { createdAt: 'desc' };
    case 'date': return { startDate: order };
    default: return { startDate: 'asc' };
  }
};

const checkVenueConflict = async (venueId: string, start: Date, end: Date, excludeEventId?: string) => {
  const conflict = await prisma.event.findFirst({
    where: {
      venueId,
      id: excludeEventId ? { not: excludeEventId } : undefined,
      status: { notIn: [EventStatus.CANCELLED, EventStatus.ARCHIVED] },
      OR: [
        { startDate: { lte: start }, endDate: { gte: start } },
        { startDate: { lte: end }, endDate: { gte: end } },
        { startDate: { gte: start }, endDate: { lte: end } },
      ],
    },
    include: { venue: true },
  });

  if (conflict) {
    throw new AppError(
      `Venue Conflict: ${conflict.venue?.name} is already booked from ${conflict.startDate.toLocaleString()} to ${conflict.endDate.toLocaleString()}.`,
      409
    );
  }
};
