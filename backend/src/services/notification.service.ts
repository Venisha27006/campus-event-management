import { prisma } from '../config/prisma';
import { NotificationType } from '@prisma/client';
import { getPaginationParams, paginate } from '../utils/response';

interface CreateNotifParams {
  userId: string;
  eventId?: string;
  type: keyof typeof NotificationType;
  title: string;
  message: string;
}

export const notificationService = {
  async create(params: CreateNotifParams) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        eventId: params.eventId,
        type: params.type as NotificationType,
        title: params.title,
        message: params.message,
      },
    });
  },

  async createBulk(notifications: CreateNotifParams[]) {
    if (!notifications.length) return;
    return prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        eventId: n.eventId,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
      })),
    });
  },

  async getUserNotifications(userId: string, page?: string, limit?: string) {
    const { page: p, limit: l, skip } = getPaginationParams(page, limit);
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: { event: { select: { id: true, title: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    return { notifications, meta: paginate(p, l, total) };
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },
};
