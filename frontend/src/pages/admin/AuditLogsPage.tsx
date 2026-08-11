import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Shield } from 'lucide-react';
import { auditApi } from '../../services';
import { Spinner, EmptyState, Pagination } from '../../components/ui';
import { formatDateTime, timeAgo } from '../../utils';

const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: () => auditApi.getAll({ page, limit: 25, search: search || undefined }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const logs = data?.data || [];

  const actionColors: Record<string, string> = {
    CREATE: 'badge-green',
    UPDATE: 'badge-blue',
    DELETE: 'badge-red',
    LOGIN: 'badge-gray',
    LOGOUT: 'badge-gray',
    APPROVE: 'badge-green',
    REJECT: 'badge-red',
    PUBLISH: 'badge-purple',
    REGISTER: 'badge-blue',
    CANCEL: 'badge-yellow',
  };

  const getActionColor = (action: string) => {
    const key = Object.keys(actionColors).find((k) => action.toUpperCase().includes(k));
    return key ? actionColors[key] : 'badge-gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 text-sm mt-1">Track all important system actions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Shield className="w-4 h-4" />
          {data?.meta?.total ?? 0} total records
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search logs..."
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn btn-secondary px-4 py-2 text-sm">Search</button>
        {search && (
          <button type="button" className="btn btn-ghost px-4 py-2 text-sm" onClick={() => { setSearch(''); setSearchInput(''); }}>
            Clear
          </button>
        )}
      </form>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !logs.length ? (
        <EmptyState
          icon={<Shield className="w-16 h-16" />}
          title="No audit logs found"
          description="System actions will appear here."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Module</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log: {
                  id: string;
                  action: string;
                  module: string;
                  description?: string;
                  ipAddress?: string;
                  createdAt: string;
                  user?: { firstName: string; lastName: string; email: string };
                }) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-gray-900">{log.user.firstName} {log.user.lastName}</p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${getActionColor(log.action)}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs font-medium uppercase tracking-wide">{log.module}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{log.description || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600 text-xs">{timeAgo(log.createdAt)}</p>
                      <p className="text-gray-400 text-xs">{formatDateTime(log.createdAt)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination meta={data.meta} onPageChange={setPage} />
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
