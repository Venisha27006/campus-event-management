import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { eventsApi, metaApi } from '../../services';
import { Button, Input, Textarea, Select, Card } from '../../components/ui';
import toast from 'react-hot-toast';

const schema = z.object({
  title: z.string().min(5, 'Min 5 characters'),
  description: z.string().min(20, 'Min 20 characters'),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Required'),
  eventType: z.string().min(1, 'Required'),
  eventMode: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  venueId: z.string().optional(),
  onlineMeetingUrl: z.string().url().optional().or(z.literal('')),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  registrationDeadline: z.string().min(1, 'Required'),
  maxCapacity: z.coerce.number().min(1, 'Min 1'),
  registrationFee: z.coerce.number().min(0).optional(),
  paymentRequired: z.boolean().optional(),
  eligibilityCriteria: z.string().optional(),
  requiredYear: z.coerce.number().optional(),
  instructions: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type EventFormValues = z.infer<typeof schema>;

const EVENT_TYPES = ['TECHNICAL','WORKSHOP','SEMINAR','CONFERENCE','HACKATHON','CULTURAL','SPORTS','CLUB_ACTIVITY','COMPETITION','GUEST_LECTURE','PLACEMENT','DEPARTMENT','FACULTY_DEVELOPMENT','OTHER'];

const CreateEditEventPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => metaApi.getCategories().then((r) => r.data.data) });
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => metaApi.getDepartments().then((r) => r.data.data) });
  const { data: venueData } = useQuery({ queryKey: ['venues'], queryFn: () => metaApi.getVenues().then((r) => r.data.data) });

  const { data: eventData } = useQuery({
    queryKey: ['event-edit', id],
    queryFn: () => eventsApi.getById(id!).then((r) => r.data.data),
    enabled: isEdit,
  });

const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { eventMode: 'OFFLINE', registrationFee: 0, paymentRequired: false },
  });

  useEffect(() => {
    if (eventData) {
      reset({
        ...eventData,
        startDate: new Date(eventData.startDate).toISOString().slice(0, 16),
        endDate: new Date(eventData.endDate).toISOString().slice(0, 16),
        registrationDeadline: new Date(eventData.registrationDeadline).toISOString().slice(0, 16),
        registrationFee: parseFloat(eventData.registrationFee),
        departmentId: eventData.departmentId || '',
        venueId: eventData.venueId || '',
      });
    }
  }, [eventData, reset]);

const mutation = useMutation({
    mutationFn: (data: EventFormValues) => {
      const { bannerImage: _b, ...payload } = data as unknown as Record<string, unknown>;
      const clean = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== '' && v !== undefined));
      const form = new FormData();
      Object.entries(clean).forEach(([k, v]) => form.append(k, String(v)));
      return isEdit ? eventsApi.update(id!, form) : eventsApi.create(form);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Event updated' : 'Event created');
      navigate('/manage-events');
    },
    onError: (err: unknown) => toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'),
  });

  const eventMode = watch('eventMode');

  const catOptions = (catData || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }));
  const deptOptions = (deptData || []).map((d: { id: string; name: string }) => ({ value: d.id, label: d.name }));
  const venueOptions = (venueData || []).map((v: { id: string; name: string }) => ({ value: v.id, label: v.name }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
        <p className="text-gray-500 text-sm">Fill in the details to {isEdit ? 'update' : 'create'} an event</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <Input label="Event Title" placeholder="e.g. National Hackathon 2026" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" placeholder="Detailed description of the event..." error={errors.description?.message} {...register('description')} />
          <Input label="Short Description" placeholder="One-line summary" {...register('shortDescription')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Category" options={catOptions} placeholder="Select category" error={errors.categoryId?.message} {...register('categoryId')} />
            <Select label="Event Type" options={EVENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} placeholder="Select type" error={errors.eventType?.message} {...register('eventType')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Event Mode" options={[{ value: 'OFFLINE', label: 'Offline' }, { value: 'ONLINE', label: 'Online' }, { value: 'HYBRID', label: 'Hybrid' }]} error={errors.eventMode?.message} {...register('eventMode')} />
            <Select label="Department" options={deptOptions} placeholder="All departments" {...register('departmentId')} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Date & Venue</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date & Time" type="datetime-local" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End Date & Time" type="datetime-local" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <Input label="Registration Deadline" type="datetime-local" error={errors.registrationDeadline?.message} {...register('registrationDeadline')} />
          {(eventMode === 'OFFLINE' || eventMode === 'HYBRID') && (
            <Select label="Venue" options={venueOptions} placeholder="Select venue" {...register('venueId')} />
          )}
          {(eventMode === 'ONLINE' || eventMode === 'HYBRID') && (
            <Input label="Online Meeting URL" type="url" placeholder="https://meet.google.com/..." error={errors.onlineMeetingUrl?.message} {...register('onlineMeetingUrl')} />
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Capacity & Registration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Maximum Capacity" type="number" min={1} error={errors.maxCapacity?.message} {...register('maxCapacity')} />
            <Input label="Registration Fee (₹)" type="number" min={0} step="0.01" {...register('registrationFee')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Required Year" options={[1,2,3,4].map((y) => ({ value: String(y), label: `Year ${y}` }))} placeholder="All years" {...register('requiredYear')} />
          </div>
          <Textarea label="Eligibility Criteria" placeholder="Who can register for this event?" {...register('eligibilityCriteria')} />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Additional Information</h2>
          <Textarea label="Instructions for Participants" placeholder="What should participants bring or prepare?" {...register('instructions')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Email" type="email" placeholder="events@campus.edu" error={errors.contactEmail?.message} {...register('contactEmail')} />
            <Input label="Contact Phone" placeholder="+91 9876543210" {...register('contactPhone')} />
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => navigate('/manage-events')}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            {isEdit ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditEventPage;
