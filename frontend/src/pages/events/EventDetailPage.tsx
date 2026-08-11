import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Users, Clock, Globe, Download } from 'lucide-react';
import { eventsApi, registrationsApi, feedbackApi, certificatesApi } from '../../services';
import { Button, Spinner, Modal, StarRating, Avatar } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { formatDate, formatCurrency, getStatusColor, isRegistrationOpen, generateICSContent, downloadBlob, cn } from '../../utils';
import toast from 'react-hot-toast';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'speakers' | 'feedback'>('overview');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ overallRating: 5, comments: '', suggestions: '' });

  const { data: eventData, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: statsData } = useQuery({
    queryKey: ['event-stats', id],
    queryFn: () => eventsApi.getStats(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: feedbackRes } = useQuery({
    queryKey: ['event-feedback', id],
    queryFn: () => eventsApi.getFeedback(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 'feedback',
  });

  const registerMutation = useMutation({
    mutationFn: () => registrationsApi.register(id!),
    onSuccess: (res) => {
      const d = res.data.data;
      if (d.waitlisted) toast.success(`Added to waitlist at position #${d.waitlistPosition}`);
      else toast.success('Registration confirmed! Check your notifications.');
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['event-stats', id] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    },
  });

  const submitFeedback = useMutation({
    mutationFn: () => feedbackApi.submit(id!, feedbackData),
    onSuccess: () => { toast.success('Feedback submitted!'); setShowFeedbackModal(false); qc.invalidateQueries({ queryKey: ['event-feedback', id] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const generateCert = useMutation({
    mutationFn: () => certificatesApi.generate(id!),
    onSuccess: () => { toast.success('Certificate generated!'); navigate('/certificates'); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!eventData) return <div className="text-center py-20 text-gray-500">Event not found</div>;

  const event = eventData;
  const regOpen = isRegistrationOpen(event);
  const available = statsData ? statsData.available : event.maxCapacity - (event._count?.registrations || 0);
  const isCompleted = event.status === 'COMPLETED';

  const addToCalendar = () => {
    const ics = generateICSContent(event);
    downloadBlob(new Blob([ics], { type: 'text/calendar' }), `${event.slug}.ics`);
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'sessions', label: 'Schedule' },
    { key: 'speakers', label: 'Speakers' },
    { key: 'feedback', label: `Feedback (${event._count?.feedbacks || 0})` },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500 to-primary-800">
        {event.bannerImage && <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="badge-blue">{event.category.name}</span>
            <span className={cn('badge', getStatusColor(event.status))}>{event.status.replace(/_/g, ' ')}</span>
            {event.isFeatured && <span className="badge bg-yellow-400 text-yellow-900">Featured</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{event.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn('px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors', activeTab === tab.key ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700')}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
                  {event.eligibilityCriteria && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Eligibility Criteria</p>
                      <p className="text-sm text-blue-700">{event.eligibilityCriteria}</p>
                    </div>
                  )}
                  {event.instructions && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Instructions</p>
                      <p className="text-sm text-yellow-700">{event.instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && <SessionsTab eventId={event.id} />}

              {activeTab === 'speakers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers?.length ? event.speakers.map((es: { speaker: { id: string; name: string; designation?: string; organization?: string; photo?: string; bio?: string } }) => (
                    <div key={es.speaker.id} className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl">
                      <Avatar name={es.speaker.name} src={es.speaker.photo} size="md" />
                      <div>
                        <p className="font-medium text-gray-900">{es.speaker.name}</p>
                        <p className="text-sm text-gray-500">{es.speaker.designation}</p>
                        <p className="text-xs text-gray-400">{es.speaker.organization}</p>
                        {es.speaker.bio && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{es.speaker.bio}</p>}
                      </div>
                    </div>
                  )) : <p className="text-gray-500 text-sm">No speakers listed yet.</p>}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="space-y-4">
                  {feedbackRes?.stats && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{feedbackRes.stats._avg.overallRating?.toFixed(1) || '—'}</p>
                        <StarRating rating={feedbackRes.stats._avg.overallRating || 0} />
                        <p className="text-xs text-gray-500 mt-1">{feedbackRes.stats._count} reviews</p>
                      </div>
                    </div>
                  )}
                  {isCompleted && isAuthenticated && (
                    <Button onClick={() => setShowFeedbackModal(true)} variant="secondary">Submit Feedback</Button>
                  )}
                  <div className="space-y-3">
                    {feedbackRes?.feedbacks?.map((f: { id: string; user: { firstName: string; lastName: string; avatar?: string } | null; overallRating: number; comments?: string; createdAt: string }) => (
                      <div key={f.id} className="p-4 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          {f.user ? <Avatar name={`${f.user.firstName} ${f.user.lastName}`} src={f.user.avatar} size="sm" /> : <div className="w-8 h-8 bg-gray-200 rounded-full" />}
                          <div>
                            <p className="text-sm font-medium">{f.user ? `${f.user.firstName} ${f.user.lastName}` : 'Anonymous'}</p>
                            <StarRating rating={f.overallRating} size="sm" />
                          </div>
                        </div>
                        {f.comments && <p className="text-sm text-gray-600">{f.comments}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Registration Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary-600">{formatCurrency(event.registrationFee)}</span>
              {statsData && (
                <span className={cn('text-sm font-medium', available > 0 ? 'text-green-600' : 'text-red-600')}>
                  {available > 0 ? `${available} seats left` : 'Full'}
                </span>
              )}
            </div>

            {statsData && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Registered</span>
                  <span>{statsData.registered} / {statsData.maxCapacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (statsData.registered / statsData.maxCapacity) * 100)}%` }} />
                </div>
                {statsData.waitlisted > 0 && <p className="text-xs text-orange-600">{statsData.waitlisted} on waitlist</p>}
              </div>
            )}

            {isAuthenticated ? (
              <div className="space-y-2">
                {regOpen && (
                  <Button className="w-full" onClick={() => registerMutation.mutate()} loading={registerMutation.isPending}>
                    {available > 0 ? 'Register Now' : 'Join Waitlist'}
                  </Button>
                )}
                {isCompleted && (
                  <Button variant="secondary" className="w-full" onClick={() => generateCert.mutate()} loading={generateCert.isPending}>
                    <Download className="w-4 h-4" />Get Certificate
                  </Button>
                )}
                <Button variant="ghost" className="w-full" onClick={addToCalendar}>
                  <Calendar className="w-4 h-4" />Add to Calendar
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => navigate('/login')}>Login to Register</Button>
            )}
          </div>

          {/* Event Info */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Event Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5 text-gray-600">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <div>
                  <p>{formatDate(event.startDate)}</p>
                  {event.startDate !== event.endDate && <p className="text-xs text-gray-400">to {formatDate(event.endDate)}</p>}
                </div>
              </div>
              {event.venue && (
                <div className="flex items-start gap-2.5 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                  <div>
                    <p>{event.venue.name}</p>
                    {event.venue.building && <p className="text-xs text-gray-400">{event.venue.building}</p>}
                  </div>
                </div>
              )}
              {event.onlineMeetingUrl && (
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Globe className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <a href={event.onlineMeetingUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate">Join Online</a>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-gray-600">
                <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span>Deadline: {formatDate(event.registrationDeadline)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <Users className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span>Capacity: {event.maxCapacity}</span>
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Organizer</h3>
            <div className="flex items-center gap-3">
              <Avatar name={`${event.organizer.firstName} ${event.organizer.lastName}`} src={event.organizer.avatar} />
              <div>
                <p className="text-sm font-medium text-gray-900">{event.organizer.firstName} {event.organizer.lastName}</p>
                <p className="text-xs text-gray-500">{event.contactEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Submit Feedback">
        <div className="space-y-4">
          <div>
            <label className="label">Overall Rating</label>
            <div className="flex gap-2 mt-1">
              {[1,2,3,4,5].map((r) => (
                <button key={r} onClick={() => setFeedbackData((d) => ({ ...d, overallRating: r }))}
                  className={cn('w-10 h-10 rounded-lg border-2 font-medium text-sm transition-colors', r <= feedbackData.overallRating ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-400')}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Comments</label>
            <textarea className="input min-h-[80px]" placeholder="Share your experience..." value={feedbackData.comments} onChange={(e) => setFeedbackData((d) => ({ ...d, comments: e.target.value }))} />
          </div>
          <div>
            <label className="label">Suggestions</label>
            <textarea className="input min-h-[60px]" placeholder="Any suggestions for improvement?" value={feedbackData.suggestions} onChange={(e) => setFeedbackData((d) => ({ ...d, suggestions: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
            <Button onClick={() => submitFeedback.mutate()} loading={submitFeedback.isPending}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const SessionsTab: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { data } = useQuery({ queryKey: ['sessions', eventId], queryFn: () => eventsApi.getSessions(eventId).then((r) => r.data.data) });
  if (!data?.length) return <p className="text-gray-500 text-sm">No schedule available yet.</p>;
  return (
    <div className="space-y-3">
      {data.map((s: { id: string; title: string; startTime: string; endTime: string; location?: string; speaker?: { name: string } }) => (
        <div key={s.id} className="flex gap-4 p-3 border border-gray-100 rounded-xl">
          <div className="text-xs text-gray-500 w-24 flex-shrink-0 pt-0.5">
            <p>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p>{new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{s.title}</p>
            {s.speaker && <p className="text-xs text-gray-500">{s.speaker.name}</p>}
            {s.location && <p className="text-xs text-gray-400">{s.location}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventDetailPage;
