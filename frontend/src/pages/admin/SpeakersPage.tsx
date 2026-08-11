import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mic2 } from 'lucide-react';
import { metaApi } from '../../services';
import { Button, Input, Spinner, EmptyState, Modal, Avatar } from '../../components/ui';
import toast from 'react-hot-toast';

interface SpeakerForm {
  name: string;
  designation: string;
  organization: string;
  expertise: string;
  bio: string;
  email: string;
}

const defaultForm: SpeakerForm = { name: '', designation: '', organization: '', expertise: '', bio: '', email: '' };

const SpeakersPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<SpeakerForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['speakers'],
    queryFn: () => metaApi.getSpeakers().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => metaApi.createSpeaker(data as FormData),
    onSuccess: () => {
      toast.success('Speaker created!');
      qc.invalidateQueries({ queryKey: ['speakers'] });
      setShowModal(false);
      setForm(defaultForm);
    },
    onError: () => toast.error('Failed to create speaker'),
  });

  const handleSubmit = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    createMutation.mutate(form);
  };

  const speakers = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Speakers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage event speakers and guest lecturers</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Speaker
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !speakers.length ? (
        <EmptyState
          icon={<Mic2 className="w-16 h-16" />}
          title="No speakers yet"
          description="Add speakers to assign them to events and sessions."
          action={<Button onClick={() => setShowModal(true)}>Add Speaker</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {speakers.map((s: { id: string; name: string; designation?: string; organization?: string; expertise?: string; bio?: string; photo?: string; email?: string }) => (
            <div key={s.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-3">
                <Avatar name={s.name} src={s.photo} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  {s.designation && <p className="text-sm text-gray-600">{s.designation}</p>}
                  {s.organization && <p className="text-xs text-gray-400">{s.organization}</p>}
                </div>
              </div>
              {s.expertise && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {s.expertise.split(',').slice(0, 3).map((e: string) => (
                    <span key={e} className="badge-blue text-xs">{e.trim()}</span>
                  ))}
                </div>
              )}
              {s.bio && <p className="text-xs text-gray-500 line-clamp-2">{s.bio}</p>}
              {s.email && <p className="text-xs text-gray-400 mt-2">{s.email}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Speaker">
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Dr. John Smith" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Designation" value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} placeholder="Professor / CTO" />
            <Input label="Organization" value={form.organization} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} placeholder="IIT Madras / Google" />
          </div>
          <Input label="Expertise" value={form.expertise} onChange={(e) => setForm((f) => ({ ...f, expertise: e.target.value }))} placeholder="AI, ML, Cloud (comma separated)" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="speaker@example.com" />
          <div className="space-y-1">
            <label className="label">Bio</label>
            <textarea className="input min-h-[80px]" placeholder="Brief biography..." value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} loading={createMutation.isPending}>Add Speaker</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SpeakersPage;
