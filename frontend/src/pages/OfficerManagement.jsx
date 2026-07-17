import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { 
  Users, Award, Power, Loader2, RefreshCw
} from 'lucide-react';

const OfficerManagement = () => {
  const { user } = useSelector((state) => state.auth);

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

  const [selectedDeptId, setSelectedDeptId] = useState(user?.role === 'ROLE_DEPT_HEAD' && (user?.departmentId ?? user?.deptId) ? (user.departmentId ?? user.deptId).toString() : '');
  const [actionLoading, setActionLoading] = useState(false);
  const [designation, setDesignation] = useState('');
  useEffect(() => {
  // Fetch initial data on component mount
  fetchStaffData();
}, []);

useEffect(() => {
  // Auto-select department for chief superintendents when user info is available
    if (user?.role === 'ROLE_DEPT_HEAD' && (user?.departmentId ?? user?.deptId)) {
      setSelectedDeptId((user.departmentId ?? user.deptId).toString());
    }
}, [user]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const endpoints = [
        api.get('/api/users'),
        api.get('/api/departments')
      ];

      // Only fetch officers if user is admin; dept heads may not have permission
        if (user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_DEPT_HEAD') {
          // Use the correct officers endpoint
          endpoints.push(api.get('/api/officers/list'));
        }

      const responses = await Promise.all(endpoints);
      
      setUsers(responses[0].data);
      setDepartments(responses[1].data || []);
      
      if (responses.length > 2) {
        setOfficers(responses[2].data || []);
        // Debug: log officers for department head
        if (user?.role === 'ROLE_DEPT_HEAD') {
          console.log('Fetched officers for dept head:', responses[2].data);
        }      } else {
        setOfficers([]);
      }
            // Auto-assign department id if department head
        if (user?.role === 'ROLE_DEPT_HEAD' && (user?.departmentId ?? user?.deptId)) {
          setSelectedDeptId((user.departmentId ?? user.deptId).toString());
        } else if (responses[1].data.length > 0) {
          setSelectedDeptId(responses[1].data[0].id.toString());
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
      // Validate required fields (department is pre‑selected for chief superintendents)
      if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim() || !designation.trim()) {
        alert('Please fill out all required fields.');
        return;
      }

      setActionLoading(true);

      try {
          const payload = {
            fullName,
            username,
            email,
            password,
            phoneNumber,
            designation,
            departmentId: selectedDeptId,
          };
          await api.post('/api/users/officers/create', payload);
        // Reset form fields
        setFullName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setPhoneNumber('');
        setDesignation('');
        // Refresh staff data to show new officer
        fetchStaffData();
        alert('Officer created successfully');
      } catch (err) {
          console.error('Error creating officer', err);
          // If officer already exists, refresh list to display existing record
          if (err.response?.status === 409 || (err.response?.data?.message && err.response.data.message.includes('already'))) {
            fetchStaffData();
            alert('Officer already exists and is now displayed in the registry.');
          } else {
            alert('Failed to create officer: ' + (err.response?.data?.message || err.message));
          }
        console.error('Error creating officer', err);
        alert('Failed to create officer: ' + (err.response?.data?.message || err.message));
      } finally {
        setActionLoading(false);
      }
    };

  // Filter users who are Officers or Department Heads
  const staffUsers = users
    .filter(u => u.role === 'ROLE_OFFICER' || u.role === 'ROLE_DEPT_HEAD')
    .map(u => {
      const detail = officers.find(o => o.userId === u.id);
      const deptId = detail?.departmentId ?? detail?.deptId;
      const deptName = detail?.departmentName ?? (departments.find(d => d.id == deptId)?.name) || 'N/A';
      return {
        ...u,
        officerId: detail?.id, // ID in officer table
        departmentId: deptId,
        departmentName: deptName,
        designation: detail?.designation || 'N/A'
      };
    })
    .filter(staff => {
      if (user?.role === 'ROLE_DEPT_HEAD') {
        return staff.departmentId == (user?.departmentId ?? user?.deptId);
      }
      return true;
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

      <div className={user?.role === 'ROLE_DEPT_HEAD' ? "grid gap-8 lg:grid-cols-3" : "w-full"}>
        {/* Officers List Table */}
        <div className={user?.role === 'ROLE_DEPT_HEAD' ? "lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden" : "w-full rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"}>
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">
              {user?.role === 'ROLE_DEPT_HEAD' ? `${departments.find(d => d.id == (user?.departmentId ?? user?.deptId))?.name || ''} Officers Registry` : 'All Department Staff Registry'}
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading staff lists...</div>
          ) : staffUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No officers or department heads registered.</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(staffUsers.reduce((acc, user) => {
                const dept = user.departmentName || 'Unassigned';
                if (!acc[dept]) acc[dept] = [];
                acc[dept].push(user);
                return acc;
              }, {})).map(([deptName, deptOfficers]) => (
                <div key={deptName} className="overflow-x-auto">
                  <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{deptName} Officers</h4>
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                        <th className="px-6 py-3">Staff ID</th>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Designation</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {deptOfficers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                            {u.role === 'ROLE_DEPT_HEAD' 
                              ? `DEPT-HEAD-${String(u.id).padStart(4, '0')}` 
                              : `${u.designation && u.designation !== 'N/A' 
                                  ? u.designation.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/-$/, '').replace(/^-/, '') 
                                  : 'OFFICER'}-${String(u.id).padStart(4, '0')}`}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-slate-800 dark:text-white font-bold">{u.fullName}</span>
                              <span className="text-xs text-slate-400 font-normal">{u.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-650 dark:text-slate-350">{u.departmentName}</td>
                          <td className="px-6 py-4 text-slate-550 dark:text-slate-400 text-xs">{u.designation}</td>
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
              ))}
            </div>
          )}
        </div>

        {/* Staff Creation Panel */}
        {user?.role !== 'ROLE_SUPER_ADMIN' && (user?.role === 'ROLE_DEPT_HEAD' || user?.role === 'ROLE_ADMIN') && (
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
                  placeholder="Enter Officer's Name"
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
                  placeholder="Enter Officer's UserName"
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
                  placeholder="Officer's Email-Id"
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
                    placeholder="Enter Password"
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
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Designation / Post</label>
                <input 
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Inspector, Assistant Engineer"
                  className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
                />
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 mt-2">Department</label>
                <input
                  type="text"
                  disabled
                  // Use the selected department ID (already set from user or default) to display the name
                  value={departments.find(d => d.id === (user?.departmentId ?? user?.deptId))?.name || ''}
                  className="w-full rounded-lg border border-slate-200 bg-gray-100 text-xs dark:border-slate-800 dark:bg-slate-800 dark:text-white p-2.5"
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
        )}
      </div>
    </div>
  );
};

export default OfficerManagement;
