import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services';
import type { Notification } from '../../types';
import { timeAgo } from '../../utils';

const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data.data.count),
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 10 }).then((r) => r.data.data),
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const count = countData || 0;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5 text-gray-600" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {count > 0 && (
              <button onClick={() => markAllRead.mutate()} className="text-xs text-primary-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {!notifData?.length ? (
              <p className="text-center text-sm text-gray-500 py-8">No notifications</p>
            ) : (
              notifData.map((n: Notification) => (
                <div key={n.id} className={`p-4 hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                  <div className="flex items-start gap-3">
                    {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
                    <div className={!n.isRead ? '' : 'ml-5'}>
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
};

export default NotificationBell;
