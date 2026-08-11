import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag } from 'lucide-react';
import { metaApi } from '../../services';
import { Button, Input, Spinner, EmptyState, Modal } from '../../components/ui';
import toast from 'react-hot-toast';

const PRESET_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const CategoriesPage: React.FC = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => metaApi.getCategories().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => metaApi.createCategory(data),
    onSuccess: () => {
      toast.success('Category created!');
      qc.invalidateQueries({ queryKey: ['categories'] });
      setShowModal(false);
      setForm({ name: '', description: '', color: '#6366f1', icon: '' });
    },
    onError: () => toast.error('Failed to create category'),
  });

  const handleSubmit = () => {
    if (!form.name) { toast.error('Category name is required'); return; }
    createMutation.mutate(form);
  };

  const categories = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage event categories for the platform</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !categories.length ? (
        <EmptyState
          icon={<Tag className="w-16 h-16" />}
          title="No categories yet"
          description="Create event categories to organize events."
          action={<Button onClick={() => setShowModal(true)}>Add Category</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat: { id: string; name: string; slug: string; description?: string; color?: string; icon?: string }) => (
            <div key={cat.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: cat.color || '#6366f1' }}
                >
                  {cat.icon || cat.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                </div>
              </div>
              {cat.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{cat.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Category">
        <div className="space-y-4">
          <Input
            label="Category Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Technical Workshop"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of this category"
          />
          <Input
            label="Icon (emoji or letter)"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            placeholder="e.g. 🔧 or T"
          />
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} loading={createMutation.isPending}>Create Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
