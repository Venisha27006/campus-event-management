import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, UserCheck, Search, CheckCircle } from 'lucide-react';
import { eventsApi, attendanceApi } from '../../services';
import { Button, Input, Spinner } from '../../components/ui';
import { formatDateTime } from '../../utils';
import toast from 'react-hot-toast';

const EventAttendancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [qrInput, setQrInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => eventsApi.getAttendance(id!).then((r) => r.data.data),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const { data: participants } = useQuery({
    queryKey: ['participants', id],
    queryFn: () => eventsApi.getParticipants(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const qrCheckin = useMutation({
    mutationFn: (qrData: string) => attendanceApi.checkInByQR(qrData),
    onSuccess: (res) => {
      toast.success(`✓ ${res.data.data?.userName || 'Participant'} checked in!`);
      setQrInput('');
      qc.invalidateQueries({ queryKey: ['attendance', id] });
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Check-in failed'),
  });

  const manualCheckin = useMutation({
    mutationFn: (registrationId: string) => attendanceApi.checkInManual(registrationId),
    onSuccess: () => { toast.success('Checked in!'); qc.invalidateQueries({ queryKey: ['attendance', id] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Check-in failed'),
  });

  const stats = attendanceData?.stats;
  const records = attendanceData?.records || [];

  const filteredParticipants = (participants || []).filter((p: { user: { firstName: string; lastName: string; email: string } }) =>
    !searchQuery || `${p.user.firstName} ${p.user.lastName} ${p.user.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 text-sm mt-1">{event?.title}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-gray-900">{stats.totalRegistered}</p><p className="text-xs text-gray-500 mt-1">Registered</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.present}</p><p className="text-xs text-gray-500 mt-1">Present</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-red-500">{stats.absent}</p><p className="text-xs text-gray-500 mt-1">Absent</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-primary-600">{stats.attendanceRate}%</p><p className="text-xs text-gray-500 mt-1">Attendance Rate</p></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Check-in */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">QR Code Check-in</h2>
          </div>
          <p className="text-sm text-gray-500">Scan or paste the participant's QR code data below.</p>
          <div className="flex gap-2">
            <Input
              placeholder="Scan or paste QR code..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && qrInput.trim()) qrCheckin.mutate(qrInput.trim()); }}
              className="flex-1"
            />
            <Button onClick={() => qrInput.trim() && qrCheckin.mutate(qrInput.trim())} loading={qrCheckin.isPending}>
              <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400">Press Enter or click the button to check in.</p>
        </div>

        {/* Manual Check-in */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Manual Check-in</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search participant..." className="input pl-9" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredParticipants.slice(0, 20).map((p: { id: string; user: { firstName: string; lastName: string; email: string }; attendance?: { checkInTime?: string } }) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.user.firstName} {p.user.lastName}</p>
                  <p className="text-xs text-gray-500">{p.user.email}</p>
                </div>
                {p.attendance?.checkInTime ? (
                  <span className="badge-green text-xs">Checked In</span>
                ) : (
                  <Button size="sm" onClick={() => manualCheckin.mutate(p.id)} loading={manualCheckin.isPending}>Check In</Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Attendance Records</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !records.length ? (
          <p className="text-center text-gray-500 py-10 text-sm">No attendance records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Participant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Check-in</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Check-out</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r: { id: string; user: { firstName: string; lastName: string }; checkInTime?: string; checkOutTime?: string; method: string }) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.user.firstName} {r.user.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.checkInTime ? formatDateTime(r.checkInTime) : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.checkOutTime ? formatDateTime(r.checkOutTime) : '—'}</td>
                    <td className="px-4 py-3"><span className="badge-blue text-xs">{r.method.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAttendancePage;
