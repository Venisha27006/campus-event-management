import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Calendar, MapPin, X, Download } from 'lucide-react';
import { registrationsApi } from '../../services';
import { Button, Spinner, EmptyState, Modal } from '../../components/ui';
import { formatDate, getStatusColor, generateICSContent, downloadBlob, cn } from '../../utils';
import type { Registration } from '../../types';
import toast from 'react-hot-toast';

const MyRegistrationsPage: React.FC = () => {
  const qc = useQueryClient();
  const [qrModal, setQrModal] = useState<Registration | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationsApi.getMyRegistrations().then((r) => r.data.data),
  });

  const { data: qrData } = useQuery({
    queryKey: ['qr', qrModal?.id],
    queryFn: () => registrationsApi.getQRCode(qrModal!.id).then((r) => r.data.data),
    enabled: !!qrModal,
  });

  const cancelMutation = useMutation({
    mutationFn: (eventId: string) => registrationsApi.cancel(eventId),
    onSuccess: () => {
      toast.success('Registration cancelled');
      qc.invalidateQueries({ queryKey: ['my-registrations'] });
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cancel failed'),
  });

  const registrations: Registration[] = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Registrations</h1>
        <p className="text-gray-500 text-sm mt-1">All your registered events</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !registrations.length ? (
        <EmptyState
          title="No registrations yet"
          description="Browse events and register to see them here."
          action={<Link to="/events"><Button>Browse Events</Button></Link>}
        />
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div key={reg.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-24 h-20 sm:h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0">
                  {reg.event?.bannerImage ? (
                    <img src={reg.event.bannerImage} alt={reg.event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      to={`/events/${reg.event?.slug || reg.eventId}`}
                      className="font-semibold text-gray-900 hover:text-primary-600 truncate"
                    >
                      {reg.event?.title}
                    </Link>
                    <span className={cn('badge text-xs', getStatusColor(reg.event?.status || 'DRAFT'))}>
                      {reg.event?.status?.replace(/_/g, ' ')}
                    </span>
                    <span className={cn('badge text-xs', reg.status === 'CONFIRMED' ? 'badge-green' : reg.status === 'WAITLISTED' ? 'badge-yellow' : 'badge-gray')}>
                      {reg.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {reg.event?.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{formatDate(reg.event.startDate)}
                      </span>
                    )}
                    {reg.event?.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{reg.event.venue.name}
                      </span>
                    )}
                    {reg.attendance?.checkInTime && (
                      <span className="text-green-600 font-medium">✓ Attended</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {reg.status === 'CONFIRMED' && (
                    <Button variant="secondary" size="sm" onClick={() => setQrModal(reg)}>
                      <QrCode className="w-4 h-4" /> QR Code
                    </Button>
                  )}
                  {reg.event && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        downloadBlob(
                          new Blob([generateICSContent(reg.event!)], { type: 'text/calendar' }),
                          `${reg.event!.slug || reg.eventId}.ics`
                        )
                      }
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {(reg.status === 'CONFIRMED' || reg.status === 'WAITLISTED') &&
                    reg.event?.status === 'REGISTRATION_OPEN' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => cancelMutation.mutate(reg.eventId)}
                        loading={cancelMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!qrModal} onClose={() => setQrModal(null)} title="Your Registration QR Code">
        <div className="text-center space-y-4">
          {qrData?.qrCodeImage ? (
            <img src={qrData.qrCodeImage} alt="QR Code" className="mx-auto w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
              <QrCode className="w-16 h-16 text-gray-300" />
            </div>
          )}
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-semibold text-gray-900">{qrModal?.event?.title}</p>
            <p className="text-xs font-mono text-gray-500">ID: {qrModal?.id?.slice(0, 8)}...</p>
            <p className="text-xs text-gray-400">Show this QR code at the event entrance</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyRegistrationsPage;
