import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle, Plus, ClipboardList } from 'lucide-react';
import { eventsApi, volunteersApi } from '../../services';
import { Button, Spinner, EmptyState, Modal, Input, Select, Avatar } from '../../components/ui';
import { formatDateTime } from '../../utils';
import toast from 'react-hot-toast';

const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const EventVolunteersPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [taskModal, setTaskModal] = useState<{ open: boolean; volunteerId: string }>({ open: false, volunteerId: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', shiftStart: '', shiftEnd: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['volunteers', eventId],
    queryFn: () => eventsApi.getVolunteers(eventId!).then((r) => r.data.data),
    enabled: !!eventId,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => volunteersApi.approve(id),
    onSuccess: () => { toast.success('Volunteer approved'); qc.invalidateQueries({ queryKey: ['volunteers', eventId] }); },
    onError: () => toast.error('Failed to approve'),
  });

  const assignTaskMutation = useMutation({
    mutationFn: () => volunteersApi.assignTask(taskModal.volunteerId, taskForm),
    onSuccess: () => {
      toast.success('Task assigned');
      setTaskModal({ open: false, volunteerId: '' });
      setTaskForm({ title: '', description: '', shiftStart: '', shiftEnd: '' });
      qc.invalidateQueries({ queryKey: ['volunteers', eventId] });
    },
    onError: () => toast.error('Failed to assign task'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => volunteersApi.updateTask(taskId, status),
    onSuccess: () => { toast.success('Task updated'); qc.invalidateQueries({ queryKey: ['volunteers', eventId] }); },
  });

  const volunteers = data || [];

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Volunteer Management</h1>
        <p className="text-gray-500 text-sm">Manage volunteers and assign tasks for this event</p>
      </div>

      {!volunteers.length ? (
        <EmptyState
          icon={<Users className="w-16 h-16" />}
          title="No volunteers yet"
          description="Volunteers who apply for this event will appear here."
        />
      ) : (
        <div className="space-y-4">
          {volunteers.map((vol: {
            id: string;
            status: string;
            notes?: string;
            approvedAt?: string;
            user: { id: string; firstName: string; lastName: string; email: string; avatar?: string };
            tasks: { id: string; title: string; description?: string; status: string; shiftStart?: string; shiftEnd?: string }[];
          }) => (
            <div key={vol.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={`${vol.user.firstName} ${vol.user.lastName}`} src={vol.user.avatar} />
                  <div>
                    <p className="font-semibold text-gray-900">{vol.user.firstName} {vol.user.lastName}</p>
                    <p className="text-xs text-gray-500">{vol.user.email}</p>
                    {vol.notes && <p className="text-xs text-gray-400 mt-0.5 italic">"{vol.notes}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${vol.status === 'APPROVED' ? 'badge-green' : vol.status === 'PENDING' ? 'badge-yellow' : 'badge-gray'}`}>
                    {vol.status}
                  </span>
                  {vol.status === 'PENDING' && (
                    <Button size="sm" onClick={() => approveMutation.mutate(vol.id)} loading={approveMutation.isPending}>
                      <CheckCircle className="w-3.5 h-3.5" />Approve
                    </Button>
                  )}
                  {vol.status === 'APPROVED' && (
                    <Button size="sm" variant="secondary" onClick={() => setTaskModal({ open: true, volunteerId: vol.id })}>
                      <Plus className="w-3.5 h-3.5" />Assign Task
                    </Button>
                  )}
                </div>
              </div>

              {vol.tasks.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" />Tasks</p>
                  <div className="space-y-2">
                    {vol.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
                          {task.shiftStart && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDateTime(task.shiftStart)} — {task.shiftEnd ? formatDateTime(task.shiftEnd) : ''}
                            </p>
                          )}
                        </div>
                        <Select
                          options={TASK_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))}
                          value={task.status}
                          onChange={(e) => updateTaskMutation.mutate({ taskId: task.id, status: e.target.value })}
                          className="text-xs w-36"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={taskModal.open} onClose={() => setTaskModal({ open: false, volunteerId: '' })} title="Assign Task">
        <div className="space-y-4">
          <Input label="Task Title *" value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Registration Desk" />
          <div className="space-y-1">
            <label className="label">Description</label>
            <textarea className="input min-h-[60px]" placeholder="Task details..." value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Shift Start" type="datetime-local" value={taskForm.shiftStart} onChange={(e) => setTaskForm((f) => ({ ...f, shiftStart: e.target.value }))} />
            <Input label="Shift End" type="datetime-local" value={taskForm.shiftEnd} onChange={(e) => setTaskForm((f) => ({ ...f, shiftEnd: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setTaskModal({ open: false, volunteerId: '' })}>Cancel</Button>
            <Button className="flex-1" onClick={() => assignTaskMutation.mutate()} loading={assignTaskMutation.isPending}>Assign Task</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventVolunteersPage;
