import { prisma } from '../config/prisma';
import { EventStatus } from '@prisma/client';

export const analyticsService = {
  async getSuperAdminDashboard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalRegistrations,
      totalAttendance,
      totalCertificates,
      categoryDistribution,
      departmentParticipation,
      monthlyRegistrations,
      monthlyEvents,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: { in: [EventStatus.REGISTRATION_OPEN, EventStatus.APPROVED, EventStatus.PUBLISHED] }, startDate: { gte: now } } }),
      prisma.event.count({ where: { status: EventStatus.COMPLETED } }),
      prisma.registration.count({ where: { status: 'CONFIRMED' } }),
      prisma.attendance.count({ where: { checkInTime: { not: null } } }),
      prisma.certificate.count(),
      prisma.event.groupBy({ by: ['categoryId'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
      prisma.registration.groupBy({
        by: ['eventId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.registration.findMany({
        where: { registeredAt: { gte: thirtyDaysAgo } },
        select: { registeredAt: true },
      }),
      prisma.event.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Group monthly data by day
    const regByDay = groupByDay(monthlyRegistrations.map((r: { registeredAt: Date }) => r.registeredAt));
    const eventsByDay = groupByDay(monthlyEvents.map((e: { createdAt: Date }) => e.createdAt));

    // Enrich category distribution
    const categories = await prisma.eventCategory.findMany({ select: { id: true, name: true } });
    const categoryMap = Object.fromEntries(categories.map((c: { id: string; name: string }) => [c.id, c.name]));

    // Enrich department participation
    const deptIds = [...new Set(departmentParticipation.map((d: { eventId: string }) => d.eventId))];
    const eventDepts = await prisma.event.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, departmentId: true, department: { select: { name: true } } },
    });
    const eventDeptMap = Object.fromEntries(
      eventDepts.map((e: { id: string; department: { name: string } | null }) => [e.id, e.department?.name ?? 'General'])
    );
    const deptAgg: Record<string, number> = {};
    departmentParticipation.forEach((d: { eventId: string; _count: { id: number } }) => {
      const name = eventDeptMap[d.eventId] ?? 'General';
      deptAgg[name] = (deptAgg[name] ?? 0) + d._count.id;
    });

    return {
      overview: { totalUsers, totalEvents, upcomingEvents, completedEvents, totalRegistrations, totalAttendance, totalCertificates },
      charts: {
        categoryDistribution: categoryDistribution.map((c: { categoryId: string; _count: { id: number } }) => ({
          category: categoryMap[c.categoryId] ?? 'Unknown',
          count: c._count.id,
        })),
        monthlyRegistrations: regByDay,
        monthlyEvents: eventsByDay,
        departmentParticipation: Object.entries(deptAgg).map(([department, count]) => ({ department, count })),
      },
    };
  },

  async getOrganizerDashboard(organizerId: string) {
    const events = await prisma.event.findMany({
      where: { organizerId },
      select: { id: true, title: true, status: true, maxCapacity: true, startDate: true },
    });

    const eventIds = events.map((e) => e.id);

    const [registrations, attendance, waitlists, certificates, feedbackStats] = await Promise.all([
      prisma.registration.count({ where: { eventId: { in: eventIds }, status: 'CONFIRMED' } }),
      prisma.attendance.count({ where: { eventId: { in: eventIds }, checkInTime: { not: null } } }),
      prisma.waitlist.count({ where: { eventId: { in: eventIds }, isActive: true } }),
      prisma.certificate.count({ where: { eventId: { in: eventIds } } }),
      prisma.feedback.aggregate({
        where: { eventId: { in: eventIds } },
        _avg: { overallRating: true },
        _count: true,
      }),
    ]);

    // Per-event stats
    const eventStats = await Promise.all(
      events.map(async (event: { id: string; title: string; status: string; maxCapacity: number; startDate: Date }) => {
        const [reg, att] = await Promise.all([
          prisma.registration.count({ where: { eventId: event.id, status: 'CONFIRMED' } }),
          prisma.attendance.count({ where: { eventId: event.id, checkInTime: { not: null } } }),
        ]);
        return {
          ...event,
          registered: reg,
          available: Math.max(0, event.maxCapacity - reg),
          attended: att,
          attendanceRate: reg > 0 ? Math.round((att / reg) * 1000) / 10 : 0,
        };
      })
    );

    return {
      overview: {
        totalEvents: events.length,
        totalRegistrations: registrations,
        totalAttendance: attendance,
        totalWaitlisted: waitlists,
        totalCertificates: certificates,
        avgFeedbackRating: feedbackStats._avg.overallRating,
        feedbackCount: feedbackStats._count,
      },
      events: eventStats,
    };
  },

  async getEventPerformanceScore(eventId: string) {
    const [regCount, maxCap, attCount, feedbackStats] = await Promise.all([
      prisma.registration.count({ where: { eventId, status: 'CONFIRMED' } }),
      prisma.event.findUnique({ where: { id: eventId }, select: { maxCapacity: true } }),
      prisma.attendance.count({ where: { eventId, checkInTime: { not: null } } }),
      prisma.feedback.aggregate({ where: { eventId }, _avg: { overallRating: true }, _count: true }),
    ]);

if (!maxCap) return null;

    const registrationScore = Math.min((regCount / maxCap.maxCapacity) * 100, 100) * 0.3;
    const attendanceScore = regCount > 0 ? (attCount / regCount) * 100 * 0.4 : 0;
    const feedbackScore = feedbackStats._avg.overallRating ? (feedbackStats._avg.overallRating / 5) * 100 * 0.3 : 0;

    const total = registrationScore + attendanceScore + feedbackScore;
    const score = Math.round(total) / 20; // Scale to 5

    return {
      score: Math.min(5, Math.round(score * 10) / 10),
      breakdown: {
        registrationFill: Math.round((regCount / maxCap.maxCapacity) * 100),
        attendanceRate: regCount > 0 ? Math.round((attCount / regCount) * 100) : 0,
        avgFeedback: feedbackStats._avg.overallRating,
        feedbackCount: feedbackStats._count,
      },
    };
  },
};

const groupByDay = (dates: Date[]): { date: string; count: number }[] => {
  const map: Record<string, number> = {};
  dates.forEach((d: Date) => {
    const key = d.toISOString().split('T')[0];
    map[key] = (map[key] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};
