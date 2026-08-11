import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi, eventsApi } from '../../services';
import { useAuth } from '../../store/auth';
import { Select, Spinner, StatsCard, StarRating } from '../../components/ui';
import { Users, Calendar, TrendingUp, Award, CheckCircle, Star } from 'lucide-react';
import { canManageEvents } from '../../utils';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN';
  const [selectedEventId, setSelectedEventId] = useState('');

  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['analytics', 'admin'],
    queryFn: () => dashboardApi.getAdminDashboard().then((r) => r.data.data),
    enabled: isAdmin,
  });

  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ['analytics', 'organizer'],
    queryFn: () => dashboardApi.getOrganizerDashboard().then((r) => r.data.data),
    enabled: !isAdmin && canManageEvents(user?.role || 'STUDENT'),
  });

  const { data: myEvents } = useQuery({
    queryKey: ['manage-events-list'],
    queryFn: () => eventsApi.getAll({ limit: 50 } as never).then((r) => r.data.data),
    enabled: !isAdmin,
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['event-performance', selectedEventId],
    queryFn: () => eventsApi.getPerformance(selectedEventId).then((r) => r.data.data),
    enabled: !!selectedEventId,
  });

  const isLoading = adminLoading || orgLoading;

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Insights and performance metrics</p>
      </div>

      {/* Admin Analytics */}
      {isAdmin && adminData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Users" value={adminData.totalUsers ?? 0} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
            <StatsCard title="Total Events" value={adminData.totalEvents ?? 0} icon={<Calendar className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
            <StatsCard title="Total Registrations" value={adminData.totalRegistrations ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="bg-green-50 text-green-600" />
            <StatsCard title="Certificates Issued" value={adminData.totalCertificates ?? 0} icon={<Award className="w-5 h-5" />} color="bg-yellow-50 text-yellow-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {adminData.monthlyRegistrations?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Monthly Registrations</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={adminData.monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {adminData.monthlyEvents?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Monthly Events Created</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={adminData.monthlyEvents}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {adminData.categoryDistribution?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Events by Category</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={adminData.categoryDistribution} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={(props) => { const p = props as unknown as { category: string; percent: number }; return `${p.category} ${(p.percent * 100).toFixed(0)}%`; }}>
                      {adminData.categoryDistribution.map((_: unknown, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {adminData.departmentParticipation?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Department Participation</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={adminData.departmentParticipation} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* Organizer Analytics */}
      {!isAdmin && orgData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="My Events" value={orgData.totalEvents ?? 0} icon={<Calendar className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
            <StatsCard title="Total Registrations" value={orgData.totalRegistrations ?? 0} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
            <StatsCard title="Avg Attendance" value={`${orgData.avgAttendanceRate ?? 0}%`} icon={<TrendingUp className="w-5 h-5" />} color="bg-green-50 text-green-600" />
            <StatsCard title="Avg Feedback" value={orgData.avgFeedbackScore ? `${orgData.avgFeedbackScore}/5` : 'N/A'} icon={<Star className="w-5 h-5" />} color="bg-yellow-50 text-yellow-600" />
          </div>
        </>
      )}

      {/* Event Performance Score */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Event Performance Score</h3>
        <div className="max-w-xs mb-4">
          <Select
            label="Select Event"
            options={(myEvents || []).map((e: { id: string; title: string }) => ({ value: e.id, label: e.title }))}
            placeholder="Choose an event..."
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          />
        </div>

        {perfLoading && <div className="flex justify-center py-8"><Spinner /></div>}

        {perfData && !perfLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary-600">{perfData.score?.toFixed(1)}</div>
              <div>
                <StarRating rating={perfData.score || 0} max={5} />
                <p className="text-sm text-gray-500 mt-1">Overall Performance Score</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Registration Rate', value: `${perfData.registrationRate ?? 0}%` },
                { label: 'Attendance Rate', value: `${perfData.attendanceRate ?? 0}%` },
                { label: 'Feedback Score', value: perfData.feedbackScore ? `${perfData.feedbackScore}/5` : 'N/A' },
                { label: 'Completion', value: perfData.completionRate ? `${perfData.completionRate}%` : 'N/A' },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedEventId && !perfLoading && (
          <p className="text-gray-400 text-sm text-center py-6">Select an event to view its performance score.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
