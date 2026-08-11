import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart2, Users, Award, MessageSquare } from 'lucide-react';
import { eventsApi } from '../../services';
import { Button, Spinner, Select } from '../../components/ui';
import toast from 'react-hot-toast';

const ReportsPage: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState('');

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events-for-reports'],
    queryFn: () => eventsApi.getAll({ limit: 100 } as never).then((r) => r.data.data),
  });

  const exportCSV = async (type: string) => {
    if (!selectedEventId) { toast.error('Please select an event first'); return; }
    try {
      if (type === 'registrations') {
        const res = await eventsApi.exportRegistrations(selectedEventId);
        const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url; a.download = `registrations-${selectedEventId}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Registration report downloaded');
      }
    } catch { toast.error('Export failed'); }
  };

  const events = (eventsData as { id: string; title: string }[] | undefined) ?? [];
  const eventOptions = events.map((e) => ({ value: e.id, label: e.title }));

  const reportTypes = [
    { id: 'registrations', title: 'Registration Report', description: 'Export all registrations with participant details, status, and check-in info', icon: <Users className="w-6 h-6 text-blue-600" />, color: 'bg-blue-50' },
    { id: 'attendance', title: 'Attendance Report', description: 'Export attendance records with check-in/check-out times and methods', icon: <BarChart2 className="w-6 h-6 text-green-600" />, color: 'bg-green-50' },
    { id: 'certificates', title: 'Certificate Report', description: 'Export list of issued certificates with verification IDs', icon: <Award className="w-6 h-6 text-yellow-600" />, color: 'bg-yellow-50' },
    { id: 'feedback', title: 'Feedback Report', description: 'Export participant feedback and ratings for the selected event', icon: <MessageSquare className="w-6 h-6 text-purple-600" />, color: 'bg-purple-50' },
  ];

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="text-gray-500 text-sm mt-1">Generate and download reports for events</p>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Select Event</h2>
        <div className="max-w-md">
          <Select options={eventOptions} placeholder="Choose an event to generate reports..." value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} />
        </div>
        {selectedEventId && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />Event selected — choose a report type below
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {reportTypes.map((report) => (
          <div key={report.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${report.color} flex-shrink-0`}>{report.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{report.description}</p>
                <Button size="sm" variant="secondary" onClick={() => exportCSV(report.id)} disabled={!selectedEventId}>
                  <Download className="w-3.5 h-3.5" />Export CSV
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEventId && <EventQuickStats eventId={selectedEventId} />}
    </div>
  );
};

const EventQuickStats: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['event-stats-report', eventId],
    queryFn: () => eventsApi.getStats(eventId).then((r) => r.data.data),
    enabled: !!eventId,
  });

  if (isLoading) return <div className="flex justify-center py-4"><Spinner /></div>;
  if (!data) return null;

  const stats = data as { maxCapacity: number; registered: number; attended: number; attendanceRate: number; available: number; waitlisted: number; feedbackCount: number; avgRating: number | null };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Event Summary</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Capacity', value: stats.maxCapacity },
          { label: 'Registered', value: stats.registered },
          { label: 'Attended', value: stats.attended },
          { label: 'Attendance Rate', value: `${stats.attendanceRate}%` },
          { label: 'Available Seats', value: stats.available },
          { label: 'Waitlisted', value: stats.waitlisted },
          { label: 'Feedback Count', value: stats.feedbackCount },
          { label: 'Avg Rating', value: stats.avgRating ? `${Number(stats.avgRating).toFixed(1)}/5` : 'N/A' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
