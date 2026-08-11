import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Eye, Send, CheckCircle, Download, Users } from 'lucide-react';
import { eventsApi } from '../../services';
import { useAuth } from '../../store/auth';
import { Button, Spinner, EmptyState, Pagination } from '../../components/ui';
import { formatDate, getStatusColor, downloadBlob } from '../../utils';
import type { Event } from '../../types';
import toast from 'react-hot-toast';

const ManageEventsPage: React.FC = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['manage-events', page, user?.id],
    queryFn: () => eventsApi.getAll({
      page,
      limit: 15,
      ...(isAdmin ? {} : { organizerId: user?.id }),
      status: undefined,
    } as never).then((r) => r.data),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => eventsApi.submitForApproval(id),
    onSuccess: () => { toast.success('Submitted for approval'); qc.invalidateQueries({ queryKey: ['manage-events'] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => eventsApi.publish(id),
    onSuccess: () => { toast.success('Event published!'); qc.invalidateQueries({ queryKey: ['manage-events'] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const handleExport = async (eventId: string, title: string) => {
    try {
      const res = await eventsApi.exportRegistrations(eventId);
      downloadBlob(res.data as Blob, `registrations-${title}.csv`);
    } catch {
      toast.error('Export failed');
    }
  };

  const events: Event[] = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage your campus events</p>
        </div>
        <Link to="/events/new"><Button><Plus className="w-4 h-4" /> New Event</Button></Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !events.length ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to get started."
          action={<Link to="/events/new"><Button>Create Event</Button></Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Registrations</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/events/${event.slug || event.id}`} className="font-medium text-gray-900 hover:text-primary-600">{event.title}</Link>
                      <p className="text-xs text-gray-500 mt-0.5">{event.category?.name} · {event.eventType.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(event.startDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${getStatusColor(event.status)}`}>{event.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{event._count?.registrations ?? 0} / {event.maxCapacity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/events/${event.slug || event.id}`}><Button variant="ghost" size="sm"><Eye className="w-3.5 h-3.5" /></Button></Link>
                        <Link to={`/events/${event.id}/edit`}><Button variant="ghost" size="sm"><Edit className="w-3.5 h-3.5" /></Button></Link>
                        {event.status === 'DRAFT' && event.organizerId === user?.id && (
                          <Button variant="secondary" size="sm" onClick={() => submitMutation.mutate(event.id)} loading={submitMutation.isPending}>
                            <Send className="w-3.5 h-3.5" /> Submit
                          </Button>
                        )}
                        {event.approvalStatus === 'ADMIN_APPROVED' && event.status === 'APPROVED' && (
                          <Button size="sm" onClick={() => publishMutation.mutate(event.id)} loading={publishMutation.isPending}>
                            <CheckCircle className="w-3.5 h-3.5" /> Publish
                          </Button>
                        )}
                        <Link to={`/events/${event.id}/attendance`}><Button variant="ghost" size="sm"><Users className="w-3.5 h-3.5" /></Button></Link>
                        <Button variant="ghost" size="sm" onClick={() => handleExport(event.id, event.title)}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination meta={data.meta} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
};

export default ManageEventsPage;
