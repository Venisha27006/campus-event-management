import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Calendar, MapPin, Users, X } from 'lucide-react';
import { wishlistApi, registrationsApi } from '../../services';
import { Button, Spinner, EmptyState } from '../../components/ui';
import { formatDate, formatCurrency, isRegistrationOpen } from '../../utils';
import toast from 'react-hot-toast';

const WishlistPage: React.FC = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getAll().then((r) => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (eventId: string) => wishlistApi.remove(eventId),
    onSuccess: () => { toast.success('Removed from wishlist'); qc.invalidateQueries({ queryKey: ['wishlist'] }); },
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => registrationsApi.register(eventId),
    onSuccess: (res) => {
      const d = res.data.data;
      if (d.waitlisted) toast.success(`Added to waitlist at position #${d.waitlistPosition}`);
      else toast.success('Registration confirmed!');
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (err: unknown) =>
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed'),
  });

  const items = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-gray-500 text-sm mt-1">Events you've saved for later</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !items.length ? (
        <EmptyState
          icon={<Heart className="w-16 h-16" />}
          title="Your wishlist is empty"
          description="Browse events and click the heart icon to save them here."
          action={<Link to="/events"><Button>Browse Events</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item: {
            id: string;
            eventId: string;
            event: {
              id: string;
              title: string;
              slug: string;
              bannerImage?: string;
              startDate: string;
              registrationDeadline: string;
              status: import('../../types').EventStatus;
              maxCapacity: number;
              registrationFee: string;
              category: { name: string };
              venue?: { name: string };
              _count?: { registrations: number };
            };
          }) => {
            const event = item.event;
            const regOpen = isRegistrationOpen(event);
            const available = event.maxCapacity - (event._count?.registrations || 0);

            return (
              <div key={item.id} className="card overflow-hidden hover:shadow-md transition-shadow group">
                {/* Banner */}
                <div className="relative h-40 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
                  {event.bannerImage ? (
                    <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-14 h-14 text-white/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="badge-blue text-xs">{event.category?.name}</span>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(event.id)}
                    className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Remove from wishlist"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <Link to={`/events/${event.slug || event.id}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                      {event.title}
                    </h3>
                  </Link>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{event.venue.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{available > 0 ? `${available} seats available` : 'Full — Waitlist open'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-600">{formatCurrency(event.registrationFee)}</span>
                    <div className="flex gap-2">
                      <Link to={`/events/${event.slug || event.id}`}>
                        <Button variant="secondary" size="sm">Details</Button>
                      </Link>
                      {regOpen && (
                        <Button
                          size="sm"
                          onClick={() => registerMutation.mutate(event.id)}
                          loading={registerMutation.isPending}
                        >
                          Register
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
