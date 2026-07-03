import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, UserCheck, ShieldAlert, Award, Power, Loader2, CheckSquare, RefreshCw 
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Officer Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [designation, setDesignation] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const userRes = await api.get('/api/users');
      setUsers(userRes.data);

      const deptRes = await api.get('/api/departments');
      setDepartments(deptRes.data);
      if (deptRes.data.length > 0) {
        setSelectedDeptId(deptRes.data[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching users management details', err);
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

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedDeptId || !designation.trim()) return;

    setActionLoading(true);
    try {
      await api.post(`/api/users/officers?userId=${selectedUserId}&departmentId=${selectedDeptId}&designation=${encodeURIComponent(designation)}`);
      setSelectedUserId('');
      setDesignation('');
      fetchUsersData();
    } catch (err) {
      alert('Failed to register officer: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteToHead = async (officerId) => {
    try {
      await api.put(`/api/users/officers/${officerId}/promote`);
      fetchUsersData();
    } catch (err) {
      alert('Failed to promote: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">User Administration</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suspend/activate users, assign officers to departments, and promote department heads.</p>
        </div>
        <button 
          onClick={fetchUsersData}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Users List Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">System Users Registry</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading user lists...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-white font-bold">{u.fullName}</span>
                          <span className="text-xs text-slate-400 font-normal">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-800">
                          {u.role.replace('ROLE_', '')}
                        </span>
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
                          {/* Toggle active status */}
                          {u.role !== 'ROLE_ADMIN' && (
                            <button 
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                                u.status === 'ACTIVE'
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                              title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Staff Assignment Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-fit space-y-4">
          <h3 className="flex items-center gap-2 text-md font-bold text-slate-800 dark:text-white">
            <Award className="h-5 w-5 text-purple-600" />
            Assign Officer Role
          </h3>
          <p className="text-xs text-slate-500">Promote a citizen to an officer and map them to their designated department.</p>

          <form onSubmit={handleCreateOfficer} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select User</label>
              <select 
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white"
              >
                <option value="">Choose User...</option>
                {users.filter(u => u.role === 'ROLE_CITIZEN').map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department Assignment</label>
              <select 
                required
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Designation / Post</label>
              <input 
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Inspector, Assistant Engineer"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Officer Role'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
