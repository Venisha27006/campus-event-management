import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, Calendar } from 'lucide-react';
import { eventsApi, metaApi, registrationsApi } from '../../services';
import type { EventFilters } from '../../types';
import EventCard from '../../components/events/EventCard';
import { Button, Spinner, EmptyState, Pagination, Select } from '../../components/ui';
import { useAuth } from '../../store/auth';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['TECHNICAL','WORKSHOP','SEMINAR','CONFERENCE','HACKATHON','CULTURAL','SPORTS','COMPETITION','GUEST_LECTURE','PLACEMENT'];

const EventsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<EventFilters>({ page: 1, limit: 12 });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => metaApi.getCategories().then((r) => r.data.data) });
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => metaApi.getDepartments().then((r) => r.data.data) });

  const { data, isLoading } = useQuery({
    queryKey: ['events', filters],
    queryFn: () => eventsApi.getAll(filters).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => setFilters((f) => ({ ...f, search: value || undefined, page: 1 })), 400);
    return () => clearTimeout(timer);
  }, []);

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => registrationsApi.register(eventId),
    onSuccess: (res) => {
      const d = res.data.data;
      if (d.waitlisted) toast.success(`Added to waitlist at position #${d.waitlistPosition}`);
      else toast.success('Registration confirmed!');
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    },
  });

  const setFilter = (key: keyof EventFilters, value: string | undefined) =>
    setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));

  const clearFilters = () => { setFilters({ page: 1, limit: 12 }); setSearch(''); };
  const hasFilters = !!(filters.categoryId || filters.departmentId || filters.eventType || filters.eventMode || filters.isFree || filters.sortBy);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover Events</h1>
        <p className="text-gray-500 text-sm mt-1">Find and register for upcoming campus events</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search events..." className="input pl-9" />
        </div>
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="w-4 h-4" />Filters{hasFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
        </Button>
        {hasFilters && <Button variant="ghost" onClick={clearFilters}><X className="w-4 h-4" />Clear</Button>}
      </div>

      {showFilters && (
        <div className="card p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Select label="Category" options={(catData || []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }))} placeholder="All categories" value={filters.categoryId || ''} onChange={(e) => setFilter('categoryId', e.target.value)} />
          <Select label="Department" options={(deptData || []).map((d: { id: string; name: string }) => ({ value: d.id, label: d.name }))} placeholder="All departments" value={filters.departmentId || ''} onChange={(e) => setFilter('departmentId', e.target.value)} />
          <Select label="Type" options={EVENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} placeholder="All types" value={filters.eventType || ''} onChange={(e) => setFilter('eventType', e.target.value)} />
          <Select label="Mode" options={[{ value: 'OFFLINE', label: 'Offline' }, { value: 'ONLINE', label: 'Online' }, { value: 'HYBRID', label: 'Hybrid' }]} placeholder="All modes" value={filters.eventMode || ''} onChange={(e) => setFilter('eventMode', e.target.value)} />
          <Select label="Fee" options={[{ value: 'true', label: 'Free' }, { value: 'false', label: 'Paid' }]} placeholder="All" value={filters.isFree || ''} onChange={(e) => setFilter('isFree', e.target.value)} />
          <Select label="Sort By" options={[{ value: 'date', label: 'Date' }, { value: 'popularity', label: 'Popularity' }, { value: 'newest', label: 'Newest' }]} placeholder="Default" value={filters.sortBy || ''} onChange={(e) => setFilter('sortBy', e.target.value)} />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data?.data?.length ? (
        <EmptyState icon={<Calendar className="w-16 h-16" />} title="No events found" description="Try adjusting your filters or search terms." action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} />
      ) : (
        <>
          <p className="text-sm text-gray-500">{data.meta?.total} events found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {data.data.map((event) => (
              <EventCard key={event.id} event={event} onRegister={isAuthenticated ? (id) => registerMutation.mutate(id) : undefined} />
            ))}
          </div>
          {data.meta && data.meta.totalPages > 1 && (
            <div className="card"><Pagination meta={data.meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} /></div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage;
