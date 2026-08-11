import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Heart } from 'lucide-react';
import type { Event } from '../../types';
import { Button } from '../ui';
import { formatDate, formatCurrency, getStatusColor, isRegistrationOpen, cn } from '../../utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../../services';
import { useAuth } from '../../store/auth';
import toast from 'react-hot-toast';

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onRegister }) => {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const isWishlisted = (event.wishlists?.length || 0) > 0;
  const registrationOpen = isRegistrationOpen(event);
  const available = event.maxCapacity - (event._count?.registrations || 0);

  const toggleWishlist = useMutation({
    mutationFn: () => isWishlisted ? wishlistApi.remove(event.id) : wishlistApi.add(event.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    },
  });

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group">
      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-primary-500 to-primary-700 overflow-hidden">
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge-blue text-xs">{event.category.name}</span>
          {event.isFeatured && <span className="badge bg-yellow-400 text-yellow-900 text-xs">Featured</span>}
        </div>
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); toggleWishlist.mutate(); }}
            className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
          >
            <Heart className={cn('w-4 h-4', isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
          </button>
        )}
        <div className="absolute bottom-3 right-3">
          <span className={cn('badge text-xs', getStatusColor(event.status))}>{event.status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={`/events/${event.slug || event.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors line-clamp-2 mb-2">{event.title}</h3>
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
            {registrationOpen && onRegister && (
              <Button size="sm" onClick={() => onRegister(event.id)}>Register</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
