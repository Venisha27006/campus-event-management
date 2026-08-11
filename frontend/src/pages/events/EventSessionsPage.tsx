import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Edit, Trash2, GripVertical } from 'lucide-react';
import { eventsApi, metaApi } from '../../services';
import { Button, Spinner, EmptyState, Modal, Input, Select } from '../../components/ui';
import toast from 'react-hot-toast';

interface SessionForm {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  speakerId: string;
  sessionType: string;
  order: string;
}

const defaultForm: SessionForm = { title: '', description: '', startTime: '', endTime: '', location: '', speakerId: '', sessionType: 'TALK', order: '1' };

const SESSION_TYPES = ['TALK', 'WORKSHOP', 'PANEL', 'BREAK', 'NETWORKING', 'INAUGURATION', 'VALEDICTORY', 'OTHER'];

const EventSessionsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(defaultForm);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions', eventId],
    queryFn: () => eventsApi.getSessions(eventId!).then((r) => r.data.data),
    enabled: !!eventId,
  });

  const { data: speakers } = useQuery({
    queryKey: ['speakers'],
    queryFn: () => metaApi.getSpeakers().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) =>
      editId
        ? eventsApi.updateSession(eventId!, editId, data)
        : eventsApi.createSession(eventId!, data),
    onSuccess: () => {
      toast.success(editId ? 'Session updated' : 'Session created');
      qc.invalidateQueries({ queryKey: ['sessions', eventId] });
      setShowModal(false);
      setForm(defaultForm);
      setEditId(null);
    },
    onError: () => toast.error('Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => eventsApi.deleteSession(eventId!, sessionId),
    onSuccess: () => { toast.success('Session deleted'); qc.invalidateQueries({ queryKey: ['sessions', eventId] }); },
    onError: () => toast.error('Failed to delete'),
  });

  const openEdit = (s: { id: string; title: string; description?: string; startTime: string; endTime: string; location?: string; speakerId?: string; sessionType: string; order: number }) => {
    setEditId(s.id);
    setForm({
      title: s.title,
      description: s.description || '',
      startTime: new Date(s.startTime).toISOString().slice(0, 16),
      endTime: new Date(s.endTime).toISOString().slice(0, 16),
      location: s.location || '',
      speakerId: s.speakerId || '',
      sessionType: s.sessionType,
      order: String(s.order),
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.startTime || !form.endTime) { toast.error('Title, start and end time are required'); return; }
    createMutation.mutate({
      ...form,
      order: parseInt(form.order) || 1,
      speakerId: form.speakerId || undefined,
      description: form.description || undefined,
      location: form.location || undefined,
    });
  };

  const speakerOptions = (speakers || []).map((s: { id: string; name: string }) => ({ value: s.id, label: s.name }));

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Schedule</h1>
          <p className="text-gray-500 text-sm">Manage sessions and agenda for this event</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setEditId(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Add Session
        </Button>
      </div>

      {!sessions?.length ? (
        <EmptyState
          icon={<Clock className="w-16 h-16" />}
          title="No sessions yet"
          description="Add sessions to build the event agenda."
          action={<Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Add Session</Button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {sessions.map((s: { id: string; title: string; description?: string; startTime: string; endTime: string; location?: string; sessionType: string; order: number; speaker?: { name: string; designation?: string } }) => (
              <div key={s.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                <GripVertical className="w-4 h-4 text-gray-300 mt-1 flex-shrink-0" />
                <div className="w-28 flex-shrink-0">
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{s.title}</p>
                    <span className="badge-gray text-xs">{s.sessionType.replace('_', ' ')}</span>
                  </div>
                  {s.description && <p className="text-sm text-gray-500 line-clamp-1">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {s.speaker && <span>🎤 {s.speaker.name}</span>}
                    {s.location && <span>📍 {s.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this session?')) deleteMutation.mutate(s.id); }} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditId(null); }} title={editId ? 'Edit Session' : 'Add Session'} size="lg">
        <div className="space-y-4">
          <Input label="Session Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Keynote Address" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Session Type" options={SESSION_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))} value={form.sessionType} onChange={(e) => setForm((f) => ({ ...f, sessionType: e.target.value }))} />
            <Input label="Order" type="number" min={1} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time *" type="datetime-local" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            <Input label="End Time *" type="datetime-local" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Speaker" options={speakerOptions} placeholder="No speaker" value={form.speakerId} onChange={(e) => setForm((f) => ({ ...f, speakerId: e.target.value }))} />
            <Input label="Location / Room" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Hall A" />
          </div>
          <div className="space-y-1">
            <label className="label">Description</label>
            <textarea className="input min-h-[60px]" placeholder="Session details..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(false); setEditId(null); }}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} loading={createMutation.isPending}>
              {editId ? 'Update' : 'Add'} Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventSessionsPage;
