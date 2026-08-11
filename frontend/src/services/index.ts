import { api } from './api';
import type { ApiResponse, AuthTokens, Event, EventFilters, PaginationMeta, Registration, Notification, Certificate, Feedback, User } from '../types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: object) => api.post<ApiResponse<User>>('/auth/register', data),
  login: (email: string, password: string) => api.post<ApiResponse<AuthTokens>>('/auth/login', { email, password }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  logoutAll: () => api.post('/auth/logout-all'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) => api.put('/auth/change-password', { currentPassword, newPassword }),
  getSessions: () => api.get('/auth/sessions'),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll: (filters?: EventFilters) => api.get<ApiResponse<Event[]> & { meta: PaginationMeta }>('/events', { params: filters }),
  getById: (id: string) => api.get<ApiResponse<Event>>(`/events/${id}`),
  create: (data: FormData) => api.post<ApiResponse<Event>>('/events', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | object) => api.put<ApiResponse<Event>>(`/events/${id}`, data),
  submitForApproval: (id: string) => api.post(`/events/${id}/submit`),
  review: (id: string, data: { decision: string; comments?: string; rejectionReason?: string }) => api.post(`/events/${id}/review`, data),
  publish: (id: string) => api.post(`/events/${id}/publish`),
  cancel: (id: string, reason?: string) => api.post(`/events/${id}/cancel`, { reason }),
  getStats: (id: string) => api.get(`/events/${id}/stats`),
  getApprovalHistory: (id: string) => api.get(`/events/${id}/approval-history`),
  getPerformance: (id: string) => api.get(`/events/${id}/performance`),
  getFeedback: (id: string) => api.get(`/events/${id}/feedback`),
  getAttendance: (id: string) => api.get(`/events/${id}/attendance`),
  getParticipants: (id: string, params?: object) => api.get(`/events/${id}/participants`, { params }),
  getSessions: (id: string) => api.get(`/events/${id}/sessions`),
  createSession: (id: string, data: object) => api.post(`/events/${id}/sessions`, data),
  updateSession: (eventId: string, sessionId: string, data: object) => api.put(`/events/${eventId}/sessions/${sessionId}`, data),
  deleteSession: (eventId: string, sessionId: string) => api.delete(`/events/${eventId}/sessions/${sessionId}`),
  assignSpeaker: (eventId: string, data: object) => api.post(`/events/${eventId}/speakers`, data),
  applyVolunteer: (eventId: string, notes?: string) => api.post(`/events/${eventId}/volunteers/apply`, { notes }),
  getVolunteers: (eventId: string) => api.get(`/events/${eventId}/volunteers`),
  exportRegistrations: (eventId: string) => api.get(`/reports/events/${eventId}/registrations`, { responseType: 'blob' }),
};

// ─── Registrations ────────────────────────────────────────────────────────────
export const registrationsApi = {
  register: (eventId: string) => api.post<ApiResponse<{ waitlisted: boolean; registration?: Registration; waitlistPosition?: number }>>(`/events/${eventId}/register`),
  cancel: (eventId: string) => api.delete(`/events/${eventId}/register`),
  getQRCode: (registrationId: string) => api.get(`/registrations/${registrationId}/qr`),
  getMyRegistrations: (params?: object) => api.get<ApiResponse<Registration[]>>('/registrations/me', { params }),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceApi = {
  checkInByQR: (qrData: string) => api.post('/attendance/qr-checkin', { qrData }),
  checkInManual: (registrationId: string) => api.post('/attendance/manual-checkin', { registrationId }),
  checkOut: (registrationId: string) => api.post('/attendance/checkout', { registrationId }),
  correct: (attendanceId: string, data: object) => api.put(`/attendance/${attendanceId}`, data),
};

// ─── Certificates ─────────────────────────────────────────────────────────────
export const certificatesApi = {
  generate: (eventId: string) => api.post<ApiResponse<Certificate>>(`/events/${eventId}/certificates/generate`),
  generateBulk: (eventId: string) => api.post(`/events/${eventId}/certificates/generate-bulk`),
  getMyCertificates: () => api.get<ApiResponse<Certificate[]>>('/certificates/me'),
  verify: (token: string) => api.get(`/certificates/verify/${token}`),
};

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const feedbackApi = {
  submit: (eventId: string, data: object) => api.post<ApiResponse<Feedback>>(`/events/${eventId}/feedback`, data),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (params?: object) => api.get<ApiResponse<Notification[]>>('/notifications', { params }),
  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getOrganizerDashboard: () => api.get('/dashboard/organizer'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get<ApiResponse<User>>('/users/me'),
  updateProfile: (data: FormData | object) => api.put<ApiResponse<User>>('/users/me', data),
  getAllUsers: (params?: object) => api.get<ApiResponse<User[]>>('/users', { params }),
  toggleStatus: (id: string) => api.put(`/users/${id}/toggle-status`),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistApi = {
  add: (eventId: string) => api.post(`/wishlist/${eventId}`),
  remove: (eventId: string) => api.delete(`/wishlist/${eventId}`),
  getAll: () => api.get('/wishlist'),
};

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metaApi = {
  getCategories: () => api.get('/categories'),
  createCategory: (data: object) => api.post('/categories', data),
  getDepartments: () => api.get('/departments'),
  createDepartment: (data: object) => api.post('/departments', data),
  getVenues: () => api.get('/venues'),
  createVenue: (data: object) => api.post('/venues', data),
  getSpeakers: () => api.get('/speakers'),
  createSpeaker: (data: object) => api.post('/speakers', data),
};

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendationsApi = {
  get: () => api.get<ApiResponse<Event[]>>('/recommendations'),
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditApi = {
  getAll: (params?: object) => api.get('/audit-logs', { params }),
};

// ─── Volunteers ───────────────────────────────────────────────────────────────
export const volunteersApi = {
  approve: (id: string) => api.put(`/volunteers/${id}/approve`),
  assignTask: (volunteerId: string, data: object) => api.post(`/volunteers/${volunteerId}/tasks`, data),
  updateTask: (taskId: string, status: string) => api.put(`/volunteers/tasks/${taskId}`, { status }),
};
