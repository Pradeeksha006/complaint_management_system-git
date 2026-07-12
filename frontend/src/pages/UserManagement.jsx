import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Power, Loader2, RefreshCw, Trash2 
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [users, totalPages, currentPage]);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const userRes = await api.get('/api/users');
      // Filter strictly for registered customers (ROLE_CITIZEN)
      setUsers(userRes.data.filter(u => u.role === 'ROLE_CITIZEN'));
    } catch (err) {
      console.error('Error fetching customers registry details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/api/users/${id}/status?status=${nextStatus}`);
      fetchUsersData();
    } catch (err) {
      alert('Failed to modify status: ' + err.message);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (window.confirm(`Are you sure you want to permanently delete citizen "${username}"?`)) {
      try {
        await api.delete(`/api/users/${id}`);
        fetchUsersData();
      } catch (err) {
        alert('Failed to delete citizen: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Citizen Administration
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suspend/activate citizen accounts and manage registered customer details.</p>
        </div>
        <button 
          onClick={fetchUsersData}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          title="Refresh List"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Users List Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Registered Customer Registry</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading citizen database...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No registered customers found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                    <th className="px-6 py-3">Customer ID</th>
                    <th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Email ID</th>
                    <th className="px-6 py-3">Phone Number</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        CUST-{String(u.id).padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4 text-slate-850 dark:text-white font-bold">
                        {u.fullName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {u.username}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-normal">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 text-slate-550 dark:text-slate-405 font-normal">
                        {u.phoneNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                              u.status === 'ACTIVE'
                                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20'
                                : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-950/20'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20"
                            title="Delete Citizen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-800 dark:text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, users.length)}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, users.length)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{users.length}</span> citizens
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        currentPage === p
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
