import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit, Send, CheckCircle, XCircle, Users, BarChart2, Download, Clock } from 'lucide-react';
import { eventsApi } from '../../services';
import type { Event } from '../../types';
import { Button, Spinner, EmptyState, Modal, Pagination } from '../../components/ui';
import { formatDate, getStatusColor, cn } from '../../utils';
import { useAuth } from '../../store/auth';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ManageEventsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; eventId: string; title: string }>({ open: false, eventId: '', title: '' });
  const [reviewData, setReviewData] = useState({ decision: 'APPROVED', comments: '', rejectionReason: '' });

  const isAdmin = ['SUPER_ADMIN', 'EVENT_ADMIN'].includes(user?.role || '');
  const isFaculty = user?.role === 'FACULTY_COORDINATOR';

  const { data, isLoading } = useQuery({
    queryKey: ['manage-events', page, user?.id],
    queryFn: () => {
      // Admin sees all events (no status filter); organizers see all statuses too but only their events
      // The backend already scopes by organizerId via the service layer when not admin
      return eventsApi.getAll({ page, limit: 15, status: undefined } as never).then((r) => r.data);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => eventsApi.submitForApproval(id),
    onSuccess: () => { toast.success('Submitted for approval'); qc.invalidateQueries({ queryKey: ['manage-events'] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => eventsApi.publish(id),
    onSuccess: () => { toast.success('Event published'); qc.invalidateQueries({ queryKey: ['manage-events'] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => eventsApi.review(reviewModal.eventId, reviewData),
    onSuccess: () => {
      toast.success(`Event ${reviewData.decision.toLowerCase()}`);
      setReviewModal({ open: false, eventId: '', title: '' });
      qc.invalidateQueries({ queryKey: ['manage-events'] });
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const exportCSV = async (eventId: string) => {
    try {
      const res = await eventsApi.exportRegistrations(eventId);
      const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a = document.createElement('a'); a.href = url; a.download = `registrations-${eventId}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
          <p className="text-gray-500 text-sm">Create and manage campus events</p>
        </div>
        <Button onClick={() => navigate('/manage-events/create')}>
          <Plus className="w-4 h-4" />New Event
        </Button>
      </div>

      {!data?.data?.length ? (
        <EmptyState title="No events found" description="Create your first event to get started." action={<Button onClick={() => navigate('/manage-events/create')}><Plus className="w-4 h-4" />Create Event</Button>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Event', 'Type', 'Date', 'Status', 'Approval', 'Capacity', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((event: Event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900 max-w-[200px] truncate">{event.title}</p>
                      <p className="text-xs text-gray-400">{event.category.name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{event.eventType.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs whitespace-nowrap">{formatDate(event.startDate)}</td>
                    <td className="py-3 px-4">
                      <span className={cn('badge text-xs', getStatusColor(event.status))}>{event.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('badge text-xs', event.approvalStatus === 'ADMIN_APPROVED' ? 'badge-green' : event.approvalStatus.includes('REJECTED') ? 'badge-red' : 'badge-yellow')}>
                        {event.approvalStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{event._count?.registrations || 0} / {event.maxCapacity}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Link to={`/events/${event.id}`}><button className="p-1.5 hover:bg-gray-100 rounded-lg" title="View"><Eye className="w-4 h-4 text-gray-500" /></button></Link>
                        <Link to={`/manage-events/${event.id}/edit`}><button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit"><Edit className="w-4 h-4 text-gray-500" /></button></Link>
                        {event.status === 'DRAFT' && (
                          <button onClick={() => submitMutation.mutate(event.id)} className="p-1.5 hover:bg-blue-50 rounded-lg" title="Submit for Approval">
                            <Send className="w-4 h-4 text-blue-500" />
                          </button>
                        )}
                        {event.status === 'PENDING_APPROVAL' && (isAdmin || isFaculty) && (
                          <button onClick={() => { setReviewModal({ open: true, eventId: event.id, title: event.title }); setReviewData({ decision: 'APPROVED', comments: '', rejectionReason: '' }); }} className="p-1.5 hover:bg-green-50 rounded-lg" title="Review">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                        )}
                        {event.approvalStatus === 'ADMIN_APPROVED' && event.status === 'APPROVED' && (
                          <button onClick={() => publishMutation.mutate(event.id)} className="p-1.5 hover:bg-purple-50 rounded-lg" title="Publish">
                            <CheckCircle className="w-4 h-4 text-purple-500" />
                          </button>
                        )}
                        <Link to={`/manage-events/${event.id}/attendance`}><button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Attendance"><Users className="w-4 h-4 text-gray-500" /></button></Link>
                        <Link to={`/manage-events/${event.id}/sessions`}><button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Sessions"><Clock className="w-4 h-4 text-gray-500" /></button></Link>
                        <Link to={`/manage-events/${event.id}/volunteers`}><button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Volunteers"><BarChart2 className="w-4 h-4 text-gray-500" /></button></Link>
                        <button onClick={() => exportCSV(event.id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Export CSV"><Download className="w-4 h-4 text-gray-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={reviewModal.open} onClose={() => setReviewModal({ open: false, eventId: '', title: '' })} title={`Review: ${reviewModal.title}`}>
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setReviewData((d) => ({ ...d, decision: 'APPROVED' }))} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors', reviewData.decision === 'APPROVED' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500')}>
              <CheckCircle className="w-4 h-4" />Approve
            </button>
            <button onClick={() => setReviewData((d) => ({ ...d, decision: 'REJECTED' }))} className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-colors', reviewData.decision === 'REJECTED' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500')}>
              <XCircle className="w-4 h-4" />Reject
            </button>
          </div>
          <div>
            <label className="label">Comments</label>
            <textarea className="input min-h-[80px]" placeholder="Optional comments..." value={reviewData.comments} onChange={(e) => setReviewData((d) => ({ ...d, comments: e.target.value }))} />
          </div>
          {reviewData.decision === 'REJECTED' && (
            <div>
              <label className="label">Rejection Reason <span className="text-red-500">*</span></label>
              <textarea className="input min-h-[60px]" placeholder="Reason for rejection..." value={reviewData.rejectionReason} onChange={(e) => setReviewData((d) => ({ ...d, rejectionReason: e.target.value }))} />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setReviewModal({ open: false, eventId: '', title: '' })}>Cancel</Button>
            <Button onClick={() => reviewMutation.mutate()} loading={reviewMutation.isPending} variant={reviewData.decision === 'APPROVED' ? 'primary' : 'danger'}>
              {reviewData.decision === 'APPROVED' ? 'Approve Event' : 'Reject Event'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageEventsPage;
