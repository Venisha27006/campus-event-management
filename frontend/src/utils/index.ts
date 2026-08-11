import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import type { EventStatus, UserRole } from '../types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: string | Date, fmt = 'dd MMM yyyy') =>
  format(new Date(date), fmt);

export const formatDateTime = (date: string | Date) =>
  format(new Date(date), 'dd MMM yyyy, hh:mm a');

export const timeAgo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const isRegistrationOpen = (event: { status: EventStatus; registrationDeadline: string }) =>
  event.status === 'REGISTRATION_OPEN' && isAfter(new Date(event.registrationDeadline), new Date());

export const getStatusColor = (status: EventStatus): string => {
  const map: Record<EventStatus, string> = {
    DRAFT: 'badge-gray',
    PENDING_APPROVAL: 'badge-yellow',
    APPROVED: 'badge-blue',
    PUBLISHED: 'badge-blue',
    REGISTRATION_OPEN: 'badge-green',
    REGISTRATION_CLOSED: 'badge-yellow',
    ONGOING: 'badge-purple',
    COMPLETED: 'badge-gray',
    CANCELLED: 'badge-red',
    ARCHIVED: 'badge-gray',
  };
  return map[status] || 'badge-gray';
};

export const getRoleLabel = (role: UserRole): string => {
  const map: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    EVENT_ADMIN: 'Event Admin',
    FACULTY_COORDINATOR: 'Faculty Coordinator',
    STUDENT_ORGANIZER: 'Student Organizer',
    STUDENT: 'Student',
    VOLUNTEER: 'Volunteer',
    SPEAKER: 'Speaker',
  };
  return map[role] || role;
};

export const canManageEvents = (role: UserRole) =>
  ['SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'].includes(role);

export const isAdmin = (role: UserRole) => ['SUPER_ADMIN', 'EVENT_ADMIN'].includes(role);

export const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num === 0 ? 'Free' : `₹${num.toFixed(2)}`;
};

export const getInitials = (firstName: string, lastName: string) =>
  `${firstName[0]}${lastName[0]}`.toUpperCase();

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateICSContent = (event: {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  venue?: { name: string };
}) => {
  const start = format(new Date(event.startDate), "yyyyMMdd'T'HHmmss");
  const end = format(new Date(event.endDate), "yyyyMMdd'T'HHmmss");
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ''}`,
    `LOCATION:${event.venue?.name || ''}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};
