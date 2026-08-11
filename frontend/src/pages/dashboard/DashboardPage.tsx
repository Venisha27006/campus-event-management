import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  Calendar, Users, Award, TrendingUp, CheckCircle,
  Clock, BookOpen, BarChart2, Zap,
} from 'lucide-react';
import { dashboardApi, recommendationsApi } from '../../services';
import { useAuth } from '../../store/auth';
import { StatsCard, Spinner, Card } from '../../components/ui';
import { isAdmin, canManageEvents, formatDate, getStatusColor, cn } from '../../utils';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// ─── Admin Dashboard Data Shape ───────────────────────────────────────────────
interface AdminDashData {
  totalUsers: number;
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalRegistrations: number;
  totalAttendance: number;
  totalCertificates: number;
  categoryDistribution: { category: string; count: number }[];
  monthlyRegistrations: { date: string; count: number }[];
  monthlyEvents: { date: string; count: number }[];
  departmentParticipation: { department: string; count: number }[];
  upcomingEventsList?: { id: string; title: string; startDate: string; status: string; category?: { name: string } }[];
}

// ─── Organizer Dashboard Data Shape ──────────────────────────────────────────
interface OrgDashData {
  totalEvents: number;
  totalRegistrations: number;
  totalAttendance: number;
  totalWaitlisted: number;
  totalCertificates: number;
  avgFeedbackRating: number | null;
  feedbackCount: number;
  avgAttendanceRate: number;
  avgFeedbackScore: number | null;
  recentEvents: {
    id: string; title: string; status: string;
    registered: number; available: number; attendanceRate: number;
  }[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminUser = isAdmin(user?.role ?? 'STUDENT');
  const isOrganizer = canManageEvents(user?.role ?? 'STUDENT');

  const { data: adminData, isLoading: adminLoading } = useQuery<AdminDashData>({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => dashboardApi.getAdminDashboard().then((r) => r.data.data),
    enabled: isAdminUser,
  });

  const { data: orgData, isLoading: orgLoading } = useQuery<OrgDashData>({
    queryKey: ['dashboard', 'organizer'],
    queryFn: () => dashboardApi.getOrganizerDashboard().then((r) => r.data.data),
    enabled: isOrganizer && !isAdminUser,
  });

  if (adminLoading || orgLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (isAdminUser && adminData) return <AdminDashboard data={adminData} />;
  if (isOrganizer && orgData) return <OrganizerDashboard data={orgData} />;
  return <StudentDashboard />;
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const AdminDashboard: React.FC<{ data: AdminDashData }> = ({ data }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="text-gray-500 text-sm">Platform-wide overview and analytics</p>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Total Users" value={data.totalUsers ?? 0} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
      <StatsCard title="Total Events" value={data.totalEvents ?? 0} icon={<Calendar className="w-5 h-5" />} color="bg-green-50 text-green-600" />
      <StatsCard title="Registrations" value={data.totalRegistrations ?? 0} icon={<BookOpen className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
      <StatsCard title="Certificates" value={data.totalCertificates ?? 0} icon={<Award className="w-5 h-5" />} color="bg-yellow-50 text-yellow-600" />
      <StatsCard title="Upcoming Events" value={data.upcomingEvents ?? 0} icon={<Clock className="w-5 h-5" />} color="bg-orange-50 text-orange-600" />
      <StatsCard title="Completed" value={data.completedEvents ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="bg-teal-50 text-teal-600" />
      <StatsCard title="Total Attendance" value={data.totalAttendance ?? 0} icon={<TrendingUp className="w-5 h-5" />} color="bg-indigo-50 text-indigo-600" />
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {(data.monthlyRegistrations?.length ?? 0) > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Registrations — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.monthlyRegistrations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {(data.categoryDistribution?.length ?? 0) > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Events by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.categoryDistribution}
                dataKey="count"
                nameKey="category"
                cx="50%" cy="50%"
                outerRadius={80}
                label={(props) => { const p = props as unknown as { category: string; percent: number }; return `${p.category} ${(p.percent * 100).toFixed(0)}%`; }}
                labelLine={false}
              >
                {data.categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {(data.monthlyEvents?.length ?? 0) > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Events Created — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthlyEvents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {(data.departmentParticipation?.length ?? 0) > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Department Participation</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.departmentParticipation} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>

    {/* Quick actions */}
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Manage Events', href: '/manage-events', icon: <Calendar className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'View Users', href: '/users', icon: <Users className="w-5 h-5 text-green-600" />, bg: 'bg-green-50' },
          { label: 'Analytics', href: '/analytics', icon: <BarChart2 className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
          { label: 'Audit Logs', href: '/audit-logs', icon: <CheckCircle className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50' },
        ].map((a) => (
          <Link key={a.href} to={a.href} className="flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow text-center gap-2">
            <div className={cn('p-2 rounded-lg', a.bg)}>{a.icon}</div>
            <span className="text-sm font-medium text-gray-700">{a.label}</span>
          </Link>
        ))}
      </div>
    </Card>

    {/* Upcoming Events */}
    {data.upcomingEventsList && data.upcomingEventsList.length > 0 && (
      <Card>
        <div className="flex items-center justify-between mb-4 px-5 pt-5">
          <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
          <Link to="/manage-events" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Event', 'Category', 'Date', 'Status'].map((h) => (
                  <th key={h} className="text-left py-2 px-5 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.upcomingEventsList.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="py-3 px-5">
                    <Link to={`/events/${e.id}`} className="font-medium text-gray-900 hover:text-primary-600">{e.title}</Link>
                  </td>
                  <td className="py-3 px-5 text-gray-500">{e.category?.name ?? '—'}</td>
                  <td className="py-3 px-5 text-gray-500">{formatDate(e.startDate)}</td>
                  <td className="py-3 px-5">
                    <span className={cn('badge text-xs', getStatusColor(e.status as never))}>{e.status.replace(/_/g, ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )}
  </div>
);

// ─── Organizer Dashboard ──────────────────────────────────────────────────────
const OrganizerDashboard: React.FC<{ data: OrgDashData }> = ({ data }) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Organizer Dashboard</h1>
      <p className="text-gray-500 text-sm">Your events at a glance</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="My Events" value={data.totalEvents ?? 0} icon={<Calendar className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
      <StatsCard title="Total Registrations" value={data.totalRegistrations ?? 0} icon={<Users className="w-5 h-5" />} color="bg-green-50 text-green-600" />
      <StatsCard title="Total Attendance" value={data.totalAttendance ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
      <StatsCard title="Certificates" value={data.totalCertificates ?? 0} icon={<Award className="w-5 h-5" />} color="bg-yellow-50 text-yellow-600" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="card p-5 text-center">
        <p className="text-3xl font-bold text-primary-600">{data.avgAttendanceRate ?? 0}%</p>
        <p className="text-sm text-gray-500 mt-1">Avg Attendance Rate</p>
      </div>
      <div className="card p-5 text-center">
        <p className="text-3xl font-bold text-amber-500">{data.avgFeedbackScore != null ? `${data.avgFeedbackScore}/5` : 'N/A'}</p>
        <p className="text-sm text-gray-500 mt-1">Avg Feedback Score</p>
      </div>
      <div className="card p-5 text-center">
        <p className="text-3xl font-bold text-orange-500">{data.totalWaitlisted ?? 0}</p>
        <p className="text-sm text-gray-500 mt-1">On Waitlist</p>
      </div>
    </div>

    {data.recentEvents?.length > 0 && (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Events</h3>
          <Link to="/manage-events" className="text-sm text-primary-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Event', 'Status', 'Registered', 'Available', 'Attendance'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentEvents.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <Link to={`/events/${e.id}`} className="font-medium text-gray-900 hover:text-primary-600">{e.title}</Link>
                  </td>
                  <td className="py-3 px-3">
                    <span className={cn('badge text-xs', getStatusColor(e.status as never))}>{e.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{e.registered}</td>
                  <td className="py-3 px-3 text-gray-600">{e.available}</td>
                  <td className="py-3 px-3">
                    <span className={e.attendanceRate >= 70 ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
                      {e.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )}

    <Card>
      <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-3">
        <Link to="/manage-events/create" className="btn btn-primary">
          <Calendar className="w-4 h-4" />Create Event
        </Link>
        <Link to="/manage-events" className="btn btn-secondary">
          <BookOpen className="w-4 h-4" />Manage Events
        </Link>
        <Link to="/analytics" className="btn btn-secondary">
          <BarChart2 className="w-4 h-4" />View Analytics
        </Link>
      </div>
    </Card>
  </div>
);

// ─── Student Dashboard ────────────────────────────────────────────────────────
const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: recommendations } = useQuery<Event[]>({
    queryKey: ['recommendations'],
    queryFn: () => recommendationsApi.get().then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-500 text-sm">Discover events, track your registrations, and collect certificates.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/events" className="card p-6 hover:shadow-md transition-shadow text-center group">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900">Browse Events</p>
          <p className="text-sm text-gray-500 mt-1">Discover upcoming campus events</p>
        </Link>
        <Link to="/my-registrations" className="card p-6 hover:shadow-md transition-shadow text-center group">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-semibold text-gray-900">My Registrations</p>
          <p className="text-sm text-gray-500 mt-1">Manage your registered events</p>
        </Link>
        <Link to="/certificates" className="card p-6 hover:shadow-md transition-shadow text-center group">
          <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-200 transition-colors">
            <Award className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="font-semibold text-gray-900">My Certificates</p>
          <p className="text-sm text-gray-500 mt-1">Download participation certificates</p>
        </Link>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />Recommended for You
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Based on your interests and department</p>
            </div>
            <Link to="/events" className="text-sm text-primary-600 hover:underline">Browse all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((event) => (
              <Link key={event.id} to={`/events/${event.slug || event.id}`} className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/30 transition-colors group">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex-shrink-0 overflow-hidden">
                  {event.bannerImage && <img src={event.bannerImage} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary-700">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{event.category?.name}</p>
                  <p className="text-xs text-primary-600 mt-0.5">{formatDate(event.startDate)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Volunteer CTA */}
      <div className="card p-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Want to get more involved?</h3>
            <p className="text-primary-100 text-sm mt-1">Volunteer at events to earn extra certificates and build your portfolio.</p>
          </div>
          <Link to="/events" className="bg-white text-primary-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors flex-shrink-0">
            Find Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
