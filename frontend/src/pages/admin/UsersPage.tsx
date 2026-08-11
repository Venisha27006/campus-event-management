import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX } from 'lucide-react';
import { usersApi } from '../../services';
import type { User } from '../../types';
import { Spinner, EmptyState, Pagination, Avatar } from '../../components/ui';
import { getRoleLabel, formatDate } from '../../utils';
import toast from 'react-hot-toast';

const UsersPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => usersApi.getAllUsers({ page, limit: 20, search: search || undefined }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const toggleStatus = useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm">Manage platform users and their roles</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search users..." className="input pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data?.data?.length ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['User', 'Role', 'Department', 'Joined', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatar} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge-blue text-xs">{getRoleLabel(user.role)}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{user.department?.name || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={user.isActive ? 'badge-green text-xs' : 'badge-red text-xs'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleStatus.mutate(user.id)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={user.isActive ? 'Deactivate' : 'Activate'}>
                        {user.isActive ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta && data.meta.totalPages > 1 && <Pagination meta={data.meta} onPageChange={setPage} />}
        </div>
      )}
    </div>
  );
};

export default UsersPage;
