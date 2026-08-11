import { prisma } from '../config/prisma';
import { EventStatus, RegistrationStatus } from '@prisma/client';
import { AppError, NotFoundError, ConflictError } from '../utils/errors';
import { generateRegistrationQRData, generateQRCodeBase64 } from '../utils/qrcode';
import { notificationService } from './notification.service';
import { getPaginationParams, paginate } from '../utils/response';

export const registrationService = {
  async register(eventId: string, userId: string) {
    // Use a transaction to prevent race conditions on capacity
    return prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          status: true,
          registrationDeadline: true,
          maxCapacity: true,
          requiredDepartmentId: true,
          requiredYear: true,
          organizerId: true,
        },
      });

      if (!event) throw new NotFoundError('Event');
      if (event.status !== EventStatus.REGISTRATION_OPEN) throw new AppError('Registration is not open for this event');
      if (new Date() > event.registrationDeadline) throw new AppError('Registration deadline has passed');

      // Check duplicate
      const existing = await tx.registration.findUnique({ where: { eventId_userId: { eventId, userId } } });
      if (existing) {
        if (existing.status === RegistrationStatus.CANCELLED) {
          throw new AppError('You previously cancelled your registration. Please contact the organizer.');
        }
        throw new ConflictError('You are already registered for this event');
      }

      // Check eligibility
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { departmentId: true, academicYear: true },
      });

      if (event.requiredDepartmentId && user?.departmentId !== event.requiredDepartmentId) {
        throw new AppError('You are not eligible for this event (department restriction)');
      }
      if (event.requiredYear && user?.academicYear !== event.requiredYear) {
        throw new AppError('You are not eligible for this event (academic year restriction)');
      }

      // Check capacity
      const confirmedCount = await tx.registration.count({
        where: { eventId, status: RegistrationStatus.CONFIRMED },
      });

      if (confirmedCount >= event.maxCapacity) {
        // Add to waitlist
        const waitlistPos = await tx.waitlist.count({ where: { eventId, isActive: true } });
        const waitlistEntry = await tx.waitlist.create({
          data: { eventId, userId, position: waitlistPos + 1 },
        });

        await notificationService.create({
          userId,
          eventId,
          type: 'GENERAL',
          title: 'Added to Waitlist',
          message: `You have been added to the waitlist for "${event.title}". Your position: #${waitlistPos + 1}`,
        });

        return { waitlisted: true, waitlistPosition: waitlistPos + 1, waitlistEntry };
      }

      // Create registration
      const qrData = generateRegistrationQRData(eventId + '-' + userId + '-' + Date.now());
      const registration = await tx.registration.create({
        data: { eventId, userId, qrCode: qrData },
        include: { event: { select: { title: true, startDate: true, venue: true } }, user: { select: { firstName: true, lastName: true, email: true } } },
      });

      await notificationService.create({
        userId,
        eventId,
        type: 'REGISTRATION_CONFIRMED',
        title: 'Registration Confirmed',
        message: `Your registration for "${event.title}" is confirmed!`,
      });

      return { waitlisted: false, registration };
    });
  },

  async cancel(eventId: string, userId: string) {
    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
      include: { event: { select: { title: true, startDate: true } } },
    });

    if (!registration) throw new NotFoundError('Registration');
    if (registration.status === RegistrationStatus.CANCELLED) throw new AppError('Registration already cancelled');
    if (registration.event.startDate < new Date()) throw new AppError('Cannot cancel registration after event has started');

    await prisma.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    });

    await notificationService.create({
      userId,
      eventId,
      type: 'REGISTRATION_CANCELLED',
      title: 'Registration Cancelled',
      message: `Your registration for "${registration.event.title}" has been cancelled.`,
    });

    // Promote next waitlisted user
    await promoteFromWaitlist(eventId);
  },

  async getQRCode(registrationId: string, userId: string) {
    const reg = await prisma.registration.findFirst({
      where: { id: registrationId, userId },
      include: { event: { select: { title: true, startDate: true } } },
    });
    if (!reg) throw new NotFoundError('Registration');
    if (reg.status !== RegistrationStatus.CONFIRMED) throw new AppError('Registration is not active');

    const qrBase64 = await generateQRCodeBase64(reg.qrCode);
    return { qrCode: qrBase64, registration: reg };
  },

  async getUserRegistrations(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);
    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where: { userId },
        include: {
          event: {
            include: { category: true, venue: true, department: true },
          },
          attendance: true,
          certificate: true,
        },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: l,
      }),
      prisma.registration.count({ where: { userId } }),
    ]);
    return { registrations, meta: paginate(p, l, total) };
  },

  async getEventParticipants(eventId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);
    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where: { eventId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, department: true, academicYear: true, rollNumber: true } },
          attendance: true,
        },
        orderBy: { registeredAt: 'asc' },
        skip,
        take: l,
      }),
      prisma.registration.count({ where: { eventId } }),
    ]);
    return { registrations, meta: paginate(p, l, total) };
  },
};

// ─── Waitlist Promotion ───────────────────────────────────────────────────────

const promoteFromWaitlist = async (eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { maxCapacity: true, title: true } });
  if (!event) return;

  const confirmedCount = await prisma.registration.count({
    where: { eventId, status: RegistrationStatus.CONFIRMED },
  });

  if (confirmedCount >= event.maxCapacity) return;

  const nextWaiting = await prisma.waitlist.findFirst({
    where: { eventId, isActive: true },
    orderBy: { position: 'asc' },
  });

  if (!nextWaiting) return;

  await prisma.$transaction(async (tx) => {
    const qrData = generateRegistrationQRData(eventId + '-' + nextWaiting.userId + '-' + Date.now());
    await tx.registration.create({
      data: { eventId, userId: nextWaiting.userId, qrCode: qrData },
    });
    await tx.waitlist.update({ where: { id: nextWaiting.id }, data: { isActive: false, notifiedAt: new Date() } });
  });

  await notificationService.create({
    userId: nextWaiting.userId,
    eventId,
    type: 'WAITLIST_PROMOTED',
    title: 'Waitlist Promotion',
    message: `Great news! A spot opened up for "${event.title}". You have been registered!`,
  });
};
