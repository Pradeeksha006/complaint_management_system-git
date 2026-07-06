import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, Award, Power, Loader2, RefreshCw, Star 
} from 'lucide-react';

const OfficerManagement = () => {
  const [users, setUsers] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [designation, setDesignation] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [usersRes, officersRes, deptsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/users/officers'),
        api.get('/api/departments')
      ]);

      setUsers(usersRes.data);
      setOfficers(officersRes.data || []);
      setDepartments(deptsRes.data || []);
      if (deptsRes.data.length > 0) {
        setSelectedDeptId(deptsRes.data[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching staff management data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/api/users/${id}/status?status=${nextStatus}`);
      fetchStaffData();
    } catch (err) {
      alert('Failed to modify status: ' + err.message);
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim() || !selectedDeptId || !designation.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/api/users/officers/create', {
        fullName,
        username,
        email,
        password,
        phoneNumber,
        designation,
        departmentId: parseInt(selectedDeptId),
        securityPin: securityPin || '123456'
      });
      // Clear form
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setPhoneNumber('');
      setSecurityPin('');
      setDesignation('');
      fetchStaffData();
      alert('New Officer account created successfully!');
    } catch (err) {
      alert('Failed to create officer account: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteToHead = async (officerId) => {
    try {
      await api.put(`/api/users/officers/${officerId}/promote`);
      fetchStaffData();
      alert('Officer successfully promoted to Department Administrator!');
    } catch (err) {
      alert('Failed to promote officer: ' + err.message);
    }
  };

  // Filter users who are Officers or Department Heads
  const staffUsers = users
    .filter(u => u.role === 'ROLE_OFFICER' || u.role === 'ROLE_DEPT_HEAD')
    .map(u => {
      const detail = officers.find(o => o.userId === u.id);
      return {
        ...u,
        officerId: detail?.id, // ID in officer table
        departmentName: detail?.departmentName || 'N/A',
        designation: detail?.designation || 'N/A'
      };
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            Staff Administration
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage department officers, assign designations, and promote department heads.</p>
        </div>
        <button 
          onClick={fetchStaffData}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Officers List Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">Department Officers Registry</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading staff lists...</div>
          ) : staffUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No officers or department heads registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                    <th className="px-6 py-3">Staff ID</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Designation</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {staffUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {u.role === 'ROLE_DEPT_HEAD' 
                          ? `DEPT-HEAD-${String(u.id).padStart(4, '0')}` 
                          : `OFFICER-${String(u.id).padStart(4, '0')}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-white font-bold">{u.fullName}</span>
                          <span className="text-xs text-slate-400 font-normal">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-650 dark:text-slate-350">
                        {u.departmentName}
                      </td>
                      <td className="px-6 py-4 text-slate-550 dark:text-slate-400 text-xs">
                        {u.designation}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          u.role === 'ROLE_DEPT_HEAD' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/20 dark:text-purple-400' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400'
                        }`}>
                          {u.role.replace('ROLE_', '').replace('_', ' ')}
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
                          {/* Promote Regular Officer to Dept Head */}
                          {u.role === 'ROLE_OFFICER' && u.officerId && (
                            <button 
                              onClick={() => handlePromoteToHead(u.officerId)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 text-purple-650 hover:bg-purple-50 dark:border-purple-900/30 dark:hover:bg-purple-950/20"
                              title="Promote to Department Head"
                            >
                              <Star className="h-3.5 w-3.5 fill-purple-650" />
                            </button>
                          )}
                          
                          {/* Toggle Active status */}
                          <button 
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                              u.status === 'ACTIVE'
                                ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-950/20'
                                : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-950/20'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Suspend Staff Account' : 'Activate Staff Account'}
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

        {/* Staff Creation Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-fit space-y-4">
          <h3 className="flex items-center gap-2 text-md font-bold text-slate-800 dark:text-white">
            <Award className="h-5 w-5 text-purple-600" />
            Add New Officer
          </h3>
          <p className="text-xs text-slate-500">Create a new department officer account and map them to their designated department.</p>

          <form onSubmit={handleCreateOfficer} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. johndoe"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@domain.com"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input 
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +919876543210"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Secret Recovery PIN</label>
              <input 
                type="text"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                placeholder="Default: 123456"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Department Assignment</label>
              <select 
                required
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation / Post</label>
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
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Officer Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfficerManagement;
