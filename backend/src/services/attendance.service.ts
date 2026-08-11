import { prisma } from '../config/prisma';
import { RegistrationStatus } from '@prisma/client';
import { AppError, NotFoundError } from '../utils/errors';
import { createAuditLog } from '../utils/audit';

export const attendanceService = {
  async checkInByQR(qrData: string, markedById: string) {
    // Parse QR data
    let registrationQrCode: string;
    try {
      const parsed = JSON.parse(qrData);
      registrationQrCode = parsed.type === 'REGISTRATION' ? qrData : qrData;
    } catch {
      registrationQrCode = qrData;
    }

    const registration = await prisma.registration.findFirst({
      where: { qrCode: registrationQrCode },
      include: {
        event: { select: { id: true, title: true, status: true, startDate: true, endDate: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        attendance: true,
      },
    });

    if (!registration) throw new AppError('Invalid QR code');
    if (registration.status !== RegistrationStatus.CONFIRMED) throw new AppError('Registration is not active');
    if (registration.attendance?.checkInTime) throw new AppError('Participant already checked in');

    const attendance = await prisma.attendance.upsert({
      where: { registrationId: registration.id },
      create: {
        eventId: registration.eventId,
        registrationId: registration.id,
        userId: registration.userId,
        checkInTime: new Date(),
        method: 'QR_SCAN',
        markedById,
      },
      update: { checkInTime: new Date(), markedById },
    });

    await createAuditLog({
      userId: markedById,
      action: 'CHECK_IN',
      module: 'ATTENDANCE',
      entityId: attendance.id,
      eventId: registration.eventId,
    });

    return { attendance, participant: registration.user, event: registration.event };
  },

  async checkInManual(registrationId: string, markedById: string) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!registration) throw new NotFoundError('Registration');
    if (registration.status !== RegistrationStatus.CONFIRMED) throw new AppError('Registration is not active');

    const existing = await prisma.attendance.findUnique({ where: { registrationId } });
    if (existing?.checkInTime) throw new AppError('Participant already checked in');

    return prisma.attendance.upsert({
      where: { registrationId },
      create: {
        eventId: registration.eventId,
        registrationId,
        userId: registration.userId,
        checkInTime: new Date(),
        method: 'MANUAL',
        markedById,
      },
      update: { checkInTime: new Date(), method: 'MANUAL', markedById },
    });
  },

  async checkOut(registrationId: string, markedById: string) {
    const attendance = await prisma.attendance.findUnique({ where: { registrationId } });
    if (!attendance) throw new NotFoundError('Attendance record');
    if (!attendance.checkInTime) throw new AppError('Participant has not checked in');
    if (attendance.checkOutTime) throw new AppError('Participant already checked out');

    return prisma.attendance.update({
      where: { registrationId },
      data: { checkOutTime: new Date(), markedById },
    });
  },

  async getEventAttendance(eventId: string) {
    const [attendance, totalRegistered] = await Promise.all([
      prisma.attendance.findMany({
        where: { eventId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, rollNumber: true } },
          registration: { select: { id: true, qrCode: true } },
        },
        orderBy: { checkInTime: 'asc' },
      }),
      prisma.registration.count({ where: { eventId, status: 'CONFIRMED' } }),
    ]);

    const present = attendance.filter((a) => a.checkInTime).length;
    const absent = totalRegistered - present;

    return {
      attendance,
      stats: {
        totalRegistered,
        present,
        absent,
        attendanceRate: totalRegistered > 0 ? Math.round((present / totalRegistered) * 1000) / 10 : 0,
      },
    };
  },

  async correctAttendance(attendanceId: string, data: { checkInTime?: Date; checkOutTime?: Date; notes?: string }, adminId: string) {
    const existing = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!existing) throw new NotFoundError('Attendance record');

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { ...data, markedById: adminId },
    });

    await createAuditLog({
      userId: adminId,
      action: 'ATTENDANCE_CORRECTION',
      module: 'ATTENDANCE',
      entityId: attendanceId,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  },
};
