import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { eventsApi } from '../../services';
import EventForm from '../../components/events/EventForm';
import type { EventFormData } from '../../components/events/EventForm';
import toast from 'react-hot-toast';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (formData: FormData) => eventsApi.create(formData),
    onSuccess: (res) => {
      toast.success('Event created successfully!');
      navigate(`/events/${res.data.data.slug || res.data.data.id}`);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create event');
    },
  });

  const handleSubmit = async (data: EventFormData, bannerFile?: File) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== '') formData.append(k, String(v)); });
    if (bannerFile) formData.append('bannerImage', bannerFile);
    await mutation.mutateAsync(formData);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to create a new campus event.</p>
      </div>
      <EventForm onSubmit={handleSubmit} isSubmitting={mutation.isPending} submitLabel="Create Event" />
    </div>
  );
};

export default CreateEventPage;
