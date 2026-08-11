import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, UserCheck, Users, TrendingUp } from 'lucide-react';
import { eventsApi, attendanceApi } from '../../services';
import { Button, Card, Spinner, StatsCard } from '../../components/ui';
import { formatDateTime } from '../../utils';
import toast from 'react-hot-toast';

const AttendancePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [manualId, setManualId] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const scannerRef = useRef<{ clear: () => void } | null>(null);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', eventId],
    queryFn: () => eventsApi.getAttendance(eventId!).then((r) => r.data.data),
    enabled: !!eventId,
    refetchInterval: 10000,
  });

  const checkInQR = useMutation({
    mutationFn: (qrData: string) => attendanceApi.checkInByQR(qrData),
    onSuccess: (res) => {
      const d = res.data.data;
      toast.success(`✓ Checked in: ${d.participant.firstName} ${d.participant.lastName}`);
      qc.invalidateQueries({ queryKey: ['attendance', eventId] });
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Check-in failed'),
  });

  const checkInManual = useMutation({
    mutationFn: (registrationId: string) => attendanceApi.checkInManual(registrationId),
    onSuccess: () => { toast.success('Checked in successfully'); setManualId(''); qc.invalidateQueries({ queryKey: ['attendance', eventId] }); },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  // QR Scanner setup
  useEffect(() => {
    if (!scanMode) { scannerRef.current?.clear(); return; }
    let scanner: { render: (cb: (d: string) => void, err: () => void) => void; clear: () => void };
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false);
      scanner.render(
        (decodedText) => { checkInQR.mutate(decodedText); },
        () => {}
      );
      scannerRef.current = scanner;
    });
return () => { if (scanner) { try { scanner.clear(); } catch {} } };
  }, [scanMode]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const stats = attendanceData?.stats;
  const attendance = attendanceData?.attendance || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 text-sm">Track and manage event attendance</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Registered" value={stats.totalRegistered} icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
          <StatsCard title="Present" value={stats.present} icon={<UserCheck className="w-5 h-5" />} color="bg-green-50 text-green-600" />
          <StatsCard title="Absent" value={stats.absent} icon={<Users className="w-5 h-5" />} color="bg-red-50 text-red-600" />
          <StatsCard title="Attendance Rate" value={`${stats.attendanceRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">QR Code Scanner</h3>
            <Button size="sm" variant={scanMode ? 'danger' : 'primary'} onClick={() => setScanMode(!scanMode)}>
              <QrCode className="w-4 h-4" />{scanMode ? 'Stop Scanner' : 'Start Scanner'}
            </Button>
          </div>
          {scanMode ? (
            <div id="qr-reader" className="w-full" />
          ) : (
            <div className="h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
              <QrCode className="w-12 h-12 mb-2" />
              <p className="text-sm">Click "Start Scanner" to scan QR codes</p>
            </div>
          )}
        </Card>

        {/* Manual Check-in */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Manual Check-in</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="Enter Registration ID..." className="input flex-1" onKeyDown={(e) => e.key === 'Enter' && manualId && checkInManual.mutate(manualId)} />
              <Button onClick={() => checkInManual.mutate(manualId)} disabled={!manualId} loading={checkInManual.isPending}>
                <UserCheck className="w-4 h-4" />Check In
              </Button>
            </div>
            <p className="text-xs text-gray-400">Enter the registration ID or press Enter to check in</p>
          </div>

          {/* Recent check-ins */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Recent Check-ins</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {attendance.slice(0, 10).map((a: { id: string; user: { firstName: string; lastName: string; rollNumber?: string }; checkInTime?: string }) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.user.firstName} {a.user.lastName}</p>
                    <p className="text-xs text-gray-500">{a.user.rollNumber}</p>
                  </div>
                  <p className="text-xs text-gray-400">{a.checkInTime ? formatDateTime(a.checkInTime) : '—'}</p>
                </div>
              ))}
              {!attendance.length && <p className="text-sm text-gray-400 text-center py-4">No check-ins yet</p>}
            </div>
          </div>
        </Card>
      </div>

      {/* Full Attendance List */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Attendance List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Name', 'Roll No', 'Check-in Time', 'Check-out Time', 'Method', 'Status'].map((h) => (
                <th key={h} className="text-left py-2 px-3 text-xs font-medium text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendance.map((a: { id: string; user: { firstName: string; lastName: string; rollNumber?: string; email: string }; checkInTime?: string; checkOutTime?: string; method: string }) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-gray-900">{a.user.firstName} {a.user.lastName}</p>
                    <p className="text-xs text-gray-400">{a.user.email}</p>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{a.user.rollNumber || '—'}</td>
                  <td className="py-2.5 px-3 text-gray-600 text-xs">{a.checkInTime ? formatDateTime(a.checkInTime) : '—'}</td>
                  <td className="py-2.5 px-3 text-gray-600 text-xs">{a.checkOutTime ? formatDateTime(a.checkOutTime) : '—'}</td>
                  <td className="py-2.5 px-3"><span className="badge-gray text-xs">{a.method.replace('_', ' ')}</span></td>
                  <td className="py-2.5 px-3">
                    <span className={a.checkInTime ? 'badge-green text-xs' : 'badge-red text-xs'}>
                      {a.checkInTime ? 'Present' : 'Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AttendancePage;
