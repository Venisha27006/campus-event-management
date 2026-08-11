import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Download, X, Calendar, MapPin } from 'lucide-react';
import { registrationsApi, certificatesApi } from '../../services';
import type { Registration } from '../../types';
import { Button, Spinner, EmptyState, Modal } from '../../components/ui';
import { formatDate, getStatusColor, cn } from '../../utils';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const MyRegistrationsPage: React.FC = () => {
  const qc = useQueryClient();
  const [qrModal, setQrModal] = useState<{ open: boolean; registrationId: string; qrCode?: string }>({ open: false, registrationId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationsApi.getMyRegistrations().then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId: string) => registrationsApi.cancel(eventId),
    onSuccess: () => { toast.success('Registration cancelled'); qc.invalidateQueries({ queryKey: ['my-registrations'] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const getCertMutation = useMutation({
    mutationFn: (eventId: string) => certificatesApi.generate(eventId),
    onSuccess: () => toast.success('Certificate generated! Check Certificates page.'),
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const showQR = async (registrationId: string) => {
    setQrModal({ open: true, registrationId });
    try {
      const res = await registrationsApi.getQRCode(registrationId);
      setQrModal({ open: true, registrationId, qrCode: res.data.data.qrCode });
    } catch {
      toast.error('Failed to load QR code');
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Registrations</h1>
        <p className="text-gray-500 text-sm">Manage your event registrations</p>
      </div>

      {!data?.length ? (
        <EmptyState icon={<Calendar className="w-16 h-16" />} title="No registrations yet" description="Browse events and register to get started." action={<Link to="/events"><Button>Browse Events</Button></Link>} />
      ) : (
        <div className="space-y-4">
          {data.map((reg: Registration) => (
            <div key={reg.id} className="card p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Event Banner */}
                <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0">
                  {reg.event.bannerImage && <img src={reg.event.bannerImage} alt="" className="w-full h-full object-cover" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link to={`/events/${reg.event.slug || reg.event.id}`} className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-1">{reg.event.title}</Link>
                    <span className={cn('badge flex-shrink-0', getStatusColor(reg.event.status))}>{reg.status}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(reg.event.startDate)}</span>
                    {reg.event.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{reg.event.venue.name}</span>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {reg.status === 'CONFIRMED' && (
                      <Button size="sm" variant="secondary" onClick={() => showQR(reg.id)}>
                        <QrCode className="w-3.5 h-3.5" />QR Code
                      </Button>
                    )}
                    {reg.event.status === 'COMPLETED' && !reg.certificate && (
                      <Button size="sm" variant="secondary" onClick={() => getCertMutation.mutate(reg.event.id)} loading={getCertMutation.isPending}>
                        <Download className="w-3.5 h-3.5" />Get Certificate
                      </Button>
                    )}
                    {reg.certificate && (
                      <a href={reg.certificate.pdfUrl || '#'} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="secondary"><Download className="w-3.5 h-3.5" />Certificate</Button>
                      </a>
                    )}
                    {reg.status === 'CONFIRMED' && reg.event.status === 'REGISTRATION_OPEN' && (
                      <Button size="sm" variant="danger" onClick={() => cancelMutation.mutate(reg.event.id)} loading={cancelMutation.isPending}>
                        <X className="w-3.5 h-3.5" />Cancel
                      </Button>
                    )}
                    {reg.attendance?.checkInTime && (
                      <span className="badge-green text-xs">✓ Attended</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      <Modal isOpen={qrModal.open} onClose={() => setQrModal({ open: false, registrationId: '' })} title="Your Registration QR Code" size="sm">
        <div className="text-center space-y-4">
          {qrModal.qrCode ? (
            <img src={qrModal.qrCode} alt="QR Code" className="mx-auto w-56 h-56" />
          ) : (
            <div className="w-56 h-56 mx-auto flex items-center justify-center"><Spinner /></div>
          )}
          <p className="text-sm text-gray-500">Show this QR code at the event entrance for check-in</p>
          <p className="text-xs text-gray-400 font-mono">{qrModal.registrationId}</p>
        </div>
      </Modal>
    </div>
  );
};

export default MyRegistrationsPage;
