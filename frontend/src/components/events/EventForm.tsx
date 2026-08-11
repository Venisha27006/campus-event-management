import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { metaApi } from '../../services';
import { Button, Input, Textarea, Select } from '../ui';

const EVENT_TYPES = ['TECHNICAL','WORKSHOP','SEMINAR','CONFERENCE','HACKATHON','CULTURAL','SPORTS','CLUB_ACTIVITY','COMPETITION','GUEST_LECTURE','PLACEMENT','DEPARTMENT','FACULTY_DEVELOPMENT','OTHER'];
const EVENT_MODES = ['OFFLINE','ONLINE','HYBRID'];

const schema = z.object({
  title: z.string().min(5, 'Min 5 characters'),
  description: z.string().min(20, 'Min 20 characters'),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Required'),
  eventType: z.string().min(1, 'Required'),
  eventMode: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  registrationDeadline: z.string().min(1, 'Required'),
  venueId: z.string().optional(),
  onlineMeetingUrl: z.string().url().optional().or(z.literal('')),
  maxCapacity: z.coerce.number().min(1, 'Min 1'),
  registrationFee: z.coerce.number().min(0).default(0),
  eligibilityCriteria: z.string().optional(),
  instructions: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

export type EventFormData = z.infer<typeof schema>;

interface EventFormProps {
  defaultValues?: Partial<EventFormData>;
  onSubmit: (data: EventFormData, bannerFile?: File) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const EventForm: React.FC<EventFormProps> = ({ defaultValues, onSubmit, isSubmitting, submitLabel = 'Save Event' }) => {
  const [bannerFile, setBannerFile] = React.useState<File>();

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => metaApi.getCategories().then((r) => r.data.data) });
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => metaApi.getDepartments().then((r) => r.data.data) });
  const { data: venueData } = useQuery({ queryKey: ['venues'], queryFn: () => metaApi.getVenues().then((r) => r.data.data) });

const { register, handleSubmit, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { eventMode: 'OFFLINE', registrationFee: 0, ...defaultValues },
  });

  const handleFormSubmit = async (data: EventFormData) => {
    await onSubmit(data, bannerFile);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Basic Information</h3>
        <Input label="Event Title *" placeholder="e.g. Web Development Workshop 2026" error={errors.title?.message} {...register('title')} />
        <Textarea label="Description *" placeholder="Detailed description of the event..." error={errors.description?.message} {...register('description')} />
        <Input label="Short Description" placeholder="One-line summary (optional)" {...register('shortDescription')} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Category *" options={(catData || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))} placeholder="Select category" error={errors.categoryId?.message} {...register('categoryId')} />
          <Select label="Event Type *" options={EVENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} placeholder="Select type" error={errors.eventType?.message} {...register('eventType')} />
          <Select label="Mode *" options={EVENT_MODES.map((m) => ({ value: m, label: m }))} error={errors.eventMode?.message} {...register('eventMode')} />
        </div>

        <Select label="Department" options={(deptData || []).map((d: { id: string; name: string }) => ({ value: d.id, label: d.name }))} placeholder="All departments" {...register('departmentId')} />
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Date & Venue</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Start Date & Time *" type="datetime-local" error={errors.startDate?.message} {...register('startDate')} />
          <Input label="End Date & Time *" type="datetime-local" error={errors.endDate?.message} {...register('endDate')} />
          <Input label="Registration Deadline *" type="datetime-local" error={errors.registrationDeadline?.message} {...register('registrationDeadline')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select label="Venue" options={(venueData || []).map((v: { id: string; name: string }) => ({ value: v.id, label: v.name }))} placeholder="Select venue" {...register('venueId')} />
          <Input label="Online Meeting URL" type="url" placeholder="https://meet.google.com/..." {...register('onlineMeetingUrl')} />
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Capacity & Fees</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Max Capacity *" type="number" min={1} error={errors.maxCapacity?.message} {...register('maxCapacity')} />
          <Input label="Registration Fee (₹)" type="number" min={0} step="0.01" {...register('registrationFee')} />
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Additional Details</h3>
        <Textarea label="Eligibility Criteria" placeholder="Who can register for this event?" {...register('eligibilityCriteria')} />
        <Textarea label="Instructions" placeholder="What should participants bring or know?" {...register('instructions')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Contact Email" type="email" placeholder="organizer@campus.edu" {...register('contactEmail')} />
          <Input label="Contact Phone" placeholder="+91 9876543210" {...register('contactPhone')} />
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Banner Image</h3>
        <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
        {bannerFile && <p className="text-xs text-gray-500">Selected: {bannerFile.name}</p>}
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">{submitLabel}</Button>
    </form>
  );
};

export default EventForm;
