import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Power, Loader2, RefreshCw 
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
                {users.map((u) => (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
