import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../services';
import EventForm from '../../components/events/EventForm';
import type { EventFormData } from '../../components/events/EventForm';
import { Spinner } from '../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const toDatetimeLocal = (d: string) => format(new Date(d), "yyyy-MM-dd'T'HH:mm");

const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => eventsApi.update(id!, formData),
    onSuccess: (res) => {
      toast.success('Event updated!');
      qc.invalidateQueries({ queryKey: ['event', id] });
      navigate(`/events/${res.data.data.slug || res.data.data.id}`);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed');
    },
  });

  const handleSubmit = async (data: EventFormData, bannerFile?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, String(v)); });
    if (bannerFile) formData.append('bannerImage', bannerFile);
    await mutation.mutateAsync(formData);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!event) return <p className="text-center text-gray-500 py-20">Event not found.</p>;

  const defaultValues: Partial<EventFormData> = {
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription || '',
    categoryId: event.categoryId,
    eventType: event.eventType,
    eventMode: event.eventMode,
    departmentId: event.departmentId || '',
    startDate: toDatetimeLocal(event.startDate),
    endDate: toDatetimeLocal(event.endDate),
    registrationDeadline: toDatetimeLocal(event.registrationDeadline),
    venueId: event.venueId || '',
    onlineMeetingUrl: event.onlineMeetingUrl || '',
    maxCapacity: event.maxCapacity,
    registrationFee: parseFloat(event.registrationFee),
    eligibilityCriteria: event.eligibilityCriteria || '',
    instructions: event.instructions || '',
    contactEmail: event.contactEmail || '',
    contactPhone: event.contactPhone || '',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-500 text-sm mt-1">Update the event details below.</p>
      </div>
      <EventForm defaultValues={defaultValues} onSubmit={handleSubmit} isSubmitting={mutation.isPending} submitLabel="Save Changes" />
    </div>
  );
};

export default EditEventPage;
