import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { LoadingScreen } from '../components/ui';
import AppLayout from '../components/layout/AppLayout';
import type { UserRole } from '../types';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage';
import EventsPage from '../pages/events/EventsPage';
import EventDetailPage from '../pages/events/EventDetailPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import MyRegistrationsPage from '../pages/profile/MyRegistrationsPage';
import CertificatesPage from '../pages/profile/CertificatesPage';
import VerifyCertificatePage from '../pages/profile/VerifyCertificatePage';
import ProfilePage from '../pages/profile/ProfilePage';
import ManageEventsPage from '../pages/admin/ManageEventsPage';
import CreateEditEventPage from '../pages/admin/CreateEditEventPage';
import AttendancePage from '../pages/admin/AttendancePage';
import UsersPage from '../pages/admin/UsersPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import CategoriesPage from '../pages/admin/CategoriesPage';
import VenuesPage from '../pages/admin/VenuesPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import WishlistPage from '../pages/wishlist/WishlistPage';
import SpeakersPage from '../pages/admin/SpeakersPage';
import EventVolunteersPage from '../pages/events/EventVolunteersPage';
import EventSessionsPage from '../pages/events/EventSessionsPage';
import ReportsPage from '../pages/admin/ReportsPage';

// ─── Guards ───────────────────────────────────────────────────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const MANAGE_ROLES: UserRole[] = ['SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'];
const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'EVENT_ADMIN'];

const AppRouter: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
    <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
    <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/verify-certificate/:token" element={<VerifyCertificatePage />} />

    {/* Protected */}
    <Route path="/" element={<RequireAuth><AppLayout><Navigate to="/dashboard" replace /></AppLayout></RequireAuth>} />
    <Route path="/dashboard" element={<RequireAuth><AppLayout><DashboardPage /></AppLayout></RequireAuth>} />
    <Route path="/events" element={<RequireAuth><AppLayout><EventsPage /></AppLayout></RequireAuth>} />
    <Route path="/events/:id" element={<RequireAuth><AppLayout><EventDetailPage /></AppLayout></RequireAuth>} />
    <Route path="/my-registrations" element={<RequireAuth><AppLayout><MyRegistrationsPage /></AppLayout></RequireAuth>} />
    <Route path="/certificates" element={<RequireAuth><AppLayout><CertificatesPage /></AppLayout></RequireAuth>} />
    <Route path="/profile" element={<RequireAuth><AppLayout><ProfilePage /></AppLayout></RequireAuth>} />

    {/* Organizer / Admin */}
    <Route path="/manage-events" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><ManageEventsPage /></AppLayout></RequireAuth>} />
    <Route path="/manage-events/create" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><CreateEditEventPage /></AppLayout></RequireAuth>} />
    <Route path="/manage-events/:id/edit" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><CreateEditEventPage /></AppLayout></RequireAuth>} />
    <Route path="/manage-events/:eventId/attendance" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><AttendancePage /></AppLayout></RequireAuth>} />

    {/* Student pages */}
    <Route path="/wishlist" element={<RequireAuth><AppLayout><WishlistPage /></AppLayout></RequireAuth>} />

    {/* Analytics */}
    <Route path="/analytics" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><AnalyticsPage /></AppLayout></RequireAuth>} />

    {/* Event sub-pages */}
    <Route path="/manage-events/:eventId/volunteers" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><EventVolunteersPage /></AppLayout></RequireAuth>} />
    <Route path="/manage-events/:eventId/sessions" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><EventSessionsPage /></AppLayout></RequireAuth>} />

    {/* Admin only */}
    <Route path="/users" element={<RequireAuth roles={ADMIN_ROLES}><AppLayout><UsersPage /></AppLayout></RequireAuth>} />
    <Route path="/venues" element={<RequireAuth roles={ADMIN_ROLES}><AppLayout><VenuesPage /></AppLayout></RequireAuth>} />
    <Route path="/categories" element={<RequireAuth roles={['SUPER_ADMIN'] as UserRole[]}><AppLayout><CategoriesPage /></AppLayout></RequireAuth>} />
    <Route path="/speakers" element={<RequireAuth roles={ADMIN_ROLES}><AppLayout><SpeakersPage /></AppLayout></RequireAuth>} />
    <Route path="/audit-logs" element={<RequireAuth roles={['SUPER_ADMIN'] as UserRole[]}><AppLayout><AuditLogsPage /></AppLayout></RequireAuth>} />
    <Route path="/reports" element={<RequireAuth roles={MANAGE_ROLES}><AppLayout><ReportsPage /></AppLayout></RequireAuth>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRouter;
