import { prisma } from '../config/prisma';
import { notificationService } from '../services/notification.service';

// Runs every 30 minutes to check for upcoming events and send reminders
export const startReminderScheduler = () => {
  const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

  const checkAndSendReminders = async () => {
    const now = new Date();

    const windows = [
      { label: '7_DAYS', hoursAhead: 7 * 24, toleranceHours: 0.5 },
      { label: '1_DAY', hoursAhead: 24, toleranceHours: 0.5 },
      { label: '1_HOUR', hoursAhead: 1, toleranceHours: 0.25 },
    ];

    for (const window of windows) {
      const targetTime = new Date(now.getTime() + window.hoursAhead * 60 * 60 * 1000);
      const toleranceMs = window.toleranceHours * 60 * 60 * 1000;

      const events = await prisma.event.findMany({
        where: {
          startDate: {
            gte: new Date(targetTime.getTime() - toleranceMs),
            lte: new Date(targetTime.getTime() + toleranceMs),
          },
          status: { in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'APPROVED', 'PUBLISHED'] },
        },
        select: { id: true, title: true, startDate: true },
      });

      for (const event of events) {
        const registrations = await prisma.registration.findMany({
          where: { eventId: event.id, status: 'CONFIRMED' },
          select: { userId: true },
        });

        if (!registrations.length) continue;

        const reminderKey = `REMINDER_${window.label}_${event.id}`;

        // Check if reminder already sent (use a simple check via notification existence)
        const alreadySent = await prisma.notification.findFirst({
          where: {
            eventId: event.id,
            type: 'EVENT_REMINDER',
            title: { contains: window.label },
          },
        });

        if (alreadySent) continue;

        const messages: Record<string, string> = {
          '7_DAYS': `Your registered event "${event.title}" is coming up in 7 days!`,
          '1_DAY': `Reminder: "${event.title}" starts tomorrow. Don't forget!`,
          '1_HOUR': `"${event.title}" starts in 1 hour. Get ready!`,
        };

        await notificationService.createBulk(
          registrations.map((r) => ({
            userId: r.userId,
            eventId: event.id,
            type: 'EVENT_REMINDER' as const,
            title: `Event Reminder [${window.label}]`,
            message: messages[window.label],
          }))
        );

        console.log(`[Scheduler] Sent ${window.label} reminders for "${event.title}" to ${registrations.length} participants`);
      }
    }
  };

  // Run immediately on startup, then on interval
  checkAndSendReminders().catch(console.error);
  setInterval(() => checkAndSendReminders().catch(console.error), INTERVAL_MS);

  console.log('[Scheduler] Event reminder scheduler started (interval: 30 min)');
};
