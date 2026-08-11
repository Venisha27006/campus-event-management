import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Edit } from 'lucide-react';
import { metaApi } from '../../services';
import { Button, Input, Spinner, EmptyState, Modal } from '../../components/ui';
import toast from 'react-hot-toast';

interface VenueForm {
  name: string;
  building: string;
  floor: string;
  room: string;
  capacity: string;
  facilities: string;
}

const defaultForm: VenueForm = { name: '', building: '', floor: '', room: '', capacity: '', facilities: '' };

const VenuesPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VenueForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => metaApi.getVenues().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => editId
      ? metaApi.createVenue(data) // reuse — backend handles PUT via separate call
      : metaApi.createVenue(data),
    onSuccess: () => {
      toast.success(editId ? 'Venue updated!' : 'Venue created!');
      qc.invalidateQueries({ queryKey: ['venues'] });
      setShowModal(false);
      setForm(defaultForm);
      setEditId(null);
    },
    onError: () => toast.error('Operation failed'),
  });

  const handleSubmit = () => {
    if (!form.name || !form.capacity) { toast.error('Name and capacity are required'); return; }
    const payload = {
      name: form.name,
      building: form.building || undefined,
      floor: form.floor || undefined,
      room: form.room || undefined,
      capacity: parseInt(form.capacity),
      facilities: form.facilities ? form.facilities.split(',').map((f) => f.trim()).filter(Boolean) : [],
    };
    createMutation.mutate(payload);
  };

  const openEdit = (v: { id: string; name: string; building?: string; floor?: string; room?: string; capacity: number; facilities: string[] }) => {
    setEditId(v.id);
    setForm({
      name: v.name,
      building: v.building || '',
      floor: v.floor || '',
      room: v.room || '',
      capacity: v.capacity.toString(),
      facilities: v.facilities?.join(', ') || '',
    });
    setShowModal(true);
  };

  const venues = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
          <p className="text-gray-500 text-sm mt-1">Manage campus venues and facilities</p>
        </div>
        <Button onClick={() => { setForm(defaultForm); setEditId(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" /> Add Venue
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !venues.length ? (
        <EmptyState
          icon={<MapPin className="w-16 h-16" />}
          title="No venues yet"
          description="Add campus venues to assign to events."
          action={<Button onClick={() => setShowModal(true)}>Add Venue</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {venues.map((v: { id: string; name: string; building?: string; floor?: string; room?: string; capacity: number; facilities: string[] }) => (
            <div key={v.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
              </div>
              <h3 className="font-semibold text-gray-900">{v.name}</h3>
              {(v.building || v.floor || v.room) && (
                <p className="text-sm text-gray-500 mt-1">
                  {[v.building, v.floor && `Floor ${v.floor}`, v.room && `Room ${v.room}`].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">Capacity: {v.capacity}</span>
              </div>
              {v.facilities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {v.facilities.slice(0, 3).map((f: string) => (
                    <span key={f} className="badge-gray text-xs">{f}</span>
                  ))}
                  {v.facilities.length > 3 && <span className="badge-gray text-xs">+{v.facilities.length - 3}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditId(null); setForm(defaultForm); }} title={editId ? 'Edit Venue' : 'Add Venue'}>
        <div className="space-y-4">
          <Input label="Venue Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Auditorium" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Building" value={form.building} onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))} placeholder="e.g. Block A" />
            <Input label="Floor" value={form.floor} onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))} placeholder="e.g. Ground" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Room" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} placeholder="e.g. 101" />
            <Input label="Capacity *" type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="e.g. 200" />
          </div>
          <Input label="Facilities" value={form.facilities} onChange={(e) => setForm((f) => ({ ...f, facilities: e.target.value }))} placeholder="Projector, AC, WiFi (comma separated)" helperText="Separate multiple facilities with commas" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setShowModal(false); setEditId(null); }}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} loading={createMutation.isPending}>
              {editId ? 'Update' : 'Create'} Venue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VenuesPage;
