export type UserRole = 'SUPER_ADMIN' | 'EVENT_ADMIN' | 'FACULTY_COORDINATOR' | 'STUDENT_ORGANIZER' | 'STUDENT' | 'VOLUNTEER' | 'SPEAKER';

export type EventStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';

export type EventType = 'TECHNICAL' | 'WORKSHOP' | 'SEMINAR' | 'CONFERENCE' | 'HACKATHON' | 'CULTURAL' | 'SPORTS' | 'CLUB_ACTIVITY' | 'COMPETITION' | 'GUEST_LECTURE' | 'PLACEMENT' | 'DEPARTMENT' | 'FACULTY_DEVELOPMENT' | 'OTHER';

export type EventMode = 'OFFLINE' | 'ONLINE' | 'HYBRID';

export type RegistrationStatus = 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED' | 'ATTENDED' | 'NO_SHOW';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  departmentId?: string;
  academicYear?: number;
  rollNumber?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  department?: Department;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
}

export interface Venue {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  capacity: number;
  facilities: string[];
}

export interface Speaker {
  id: string;
  name: string;
  email?: string;
  organization?: string;
  designation?: string;
  expertise: string[];
  bio?: string;
  photo?: string;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  eventType: EventType;
  eventMode: EventMode;
  departmentId?: string;
  organizerId: string;
  bannerImage?: string;
  startDate: string;
  endDate: string;
  venueId?: string;
  onlineMeetingUrl?: string;
  maxCapacity: number;
  registrationDeadline: string;
  status: EventStatus;
  approvalStatus: string;
  isPublic: boolean;
  isFeatured: boolean;
registrationFee: string;
  paymentRequired: boolean;
  contactEmail?: string;
  contactPhone?: string;
  eligibilityCriteria?: string;
  instructions?: string;
  viewCount: number;
  createdAt: string;
  category: EventCategory;
  department?: Department;
  organizer: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatar'>;
  facultyCoordinator?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  venue?: Venue;
  tags: { tag: { id: string; name: string } }[];
  speakers?: { speaker: Speaker }[];
  wishlists?: { id: string }[];
  _count?: { registrations: number; waitlists: number; feedbacks: number };
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  qrCode: string;
  registeredAt: string;
  cancelledAt?: string;
  paymentStatus: string;
  event: Event;
  attendance?: Attendance;
  certificate?: Certificate;
}

export interface Attendance {
  id: string;
  checkInTime?: string;
  checkOutTime?: string;
  method: string;
}

export interface Certificate {
  id: string;
  certificateId: string;
  eventId: string;
  userId: string;
  issuedAt: string;
  pdfUrl?: string;
  verifyToken: string;
  event?: Pick<Event, 'title' | 'startDate' | 'category'>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  event?: Pick<Event, 'id' | 'title' | 'slug'>;
}

export interface Feedback {
  id: string;
  overallRating: number;
  speakerRating?: number;
  organizationRating?: number;
  venueRating?: number;
  contentRating?: number;
  comments?: string;
  suggestions?: string;
  isAnonymous: boolean;
  createdAt: string;
  user?: Pick<User, 'firstName' | 'lastName' | 'avatar'> | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface EventFilters {
  search?: string;
  categoryId?: string;
  departmentId?: string;
  eventType?: string;
  eventMode?: string;
  startDate?: string;
  endDate?: string;
  isFree?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
