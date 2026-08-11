import { prisma } from '../config/prisma';
import { AppError, NotFoundError } from '../utils/errors';

export const feedbackService = {
  async submit(eventId: string, userId: string, data: {
    overallRating: number;
    speakerRating?: number;
    organizationRating?: number;
    venueRating?: number;
    contentRating?: number;
    comments?: string;
    suggestions?: string;
    isAnonymous?: boolean;
  }) {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { status: true, title: true } });
    if (!event) throw new NotFoundError('Event');
    if (event.status !== 'COMPLETED') throw new AppError('Feedback can only be submitted for completed events');

    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!registration) throw new AppError('You must be registered to submit feedback');

    const existing = await prisma.feedback.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (existing) throw new AppError('You have already submitted feedback for this event');

    // Validate ratings
    const ratings = [data.overallRating, data.speakerRating, data.organizationRating, data.venueRating, data.contentRating].filter(Boolean);
    if (ratings.some((r) => r! < 1 || r! > 5)) throw new AppError('Ratings must be between 1 and 5');

    return prisma.feedback.create({ data: { eventId, userId, ...data } });
  },

  async getEventFeedback(eventId: string) {
    const [feedbacks, stats] = await Promise.all([
      prisma.feedback.findMany({
        where: { eventId },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feedback.aggregate({
        where: { eventId },
        _avg: {
          overallRating: true,
          speakerRating: true,
          organizationRating: true,
          venueRating: true,
          contentRating: true,
        },
        _count: true,
      }),
    ]);

    // Mask anonymous feedback
    const sanitized = feedbacks.map((f) => ({
      ...f,
      user: f.isAnonymous ? null : f.user,
    }));

    return { feedbacks: sanitized, stats };
  },
};
