import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Inbox, UserCheck, Clock, CheckSquare, Loader2, RefreshCcw, Building2, CheckSquare as CheckIcon
} from 'lucide-react';

const DeptHeadDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  // State variables
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, avgTime: 0 });
  const [loading, setLoading] = useState(true);

  // Transfer and Assignment States
  const [assigningTo, setAssigningTo] = useState({}); // complaintId -> officerId
  const [transferringTo, setTransferringTo] = useState({}); // complaintId -> deptId
  const [transferRemarks, setTransferRemarks] = useState({}); // complaintId -> remarks
  const [actioningId, setActioningId] = useState(null);

  // Fetch all departments for switcher
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Sync selectedDeptId once user session is loaded/restored
  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN' && departments.length > 0 && !selectedDeptId) {
      setSelectedDeptId(departments[0].id);
    } else if (user?.departmentId && !selectedDeptId) {
      setSelectedDeptId(user.departmentId);
    }
  }, [user, departments, selectedDeptId]);

  // Fetch department-specific data whenever selectedDeptId changes
  useEffect(() => {
    if (selectedDeptId) {
      fetchDeptData(selectedDeptId);
    }
  }, [selectedDeptId]);

  const fetchDepartments = async () => {
    try {
      const deptRes = await api.get('/api/departments');
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Error fetching departments list', err);
    }
  };

  const fetchDeptData = async (deptId) => {
    try {
      setLoading(true);
      // Fetch department complaints
      const response = await api.get(`/api/complaints?deptId=${deptId}&size=200`);
      const list = response.data.content || [];
      setComplaints(list);

      // Fetch officers
      const offRes = await api.get('/api/users/officers');
      // Filter officers belonging to this department
      setOfficers(offRes.data.filter(o => o.departmentId === Number(deptId)));

      // Compute statistics
      const resolved = list.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      setStats({
        total: list.length,
        pending: list.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED').length,
        resolved: resolved,
        avgTime: 2.1 // Mock average days resolution
      });
    } catch (err) {
      console.error('Error fetching department details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (complaintId) => {
    const officerId = assigningTo[complaintId];
    if (!officerId) return;

    setActioningId(complaintId);
    try {
      await api.put(`/api/complaints/${complaintId}/assign?officerId=${officerId}`);
      fetchDeptData(selectedDeptId);
      alert('Officer assigned successfully!');
    } catch (err) {
      alert('Failed to assign: ' + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const handleTransfer = async (complaintId) => {
    const targetDeptId = transferringTo[complaintId];
    const remarks = transferRemarks[complaintId] || 'Department transfer request';
    if (!targetDeptId) return;

    setActioningId(complaintId);
    try {
      await api.put(`/api/complaints/${complaintId}/transfer?targetDeptId=${targetDeptId}&remarks=${remarks}`);
      fetchDeptData(selectedDeptId);
      alert('Department transferred successfully!');
    } catch (err) {
      alert('Failed to transfer: ' + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    if (!newStatus) return;
    setActioningId(complaintId);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('remarks', 'Status updated by Department Administrator');

      await api.put(`/api/complaints/${complaintId}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      fetchDeptData(selectedDeptId);
      alert('Status updated successfully!');
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  // Compile Chart data for Officer workload
  const getWorkloadData = () => {
    return officers.map(o => {
      const assignedCount = complaints.filter(c => c.assignedOfficerId === o.id).length;
      return {
        name: o.fullName ? o.fullName.split(' ')[0] : 'Officer', // First name
        Workload: assignedCount
      };
    });
  };

  const workloadData = getWorkloadData();
  const currentDeptName = departments.find(d => d.id === Number(selectedDeptId))?.name || 'Department Control';

  return (
    <div className="space-y-8">
      {/* Header & Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            {currentDeptName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review local tickets, assign field officers, and resolve cases.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Department switcher for Super Admin */}
          {user?.role === 'ROLE_ADMIN' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Switch Department:</span>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-0"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={() => fetchDeptData(selectedDeptId)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
            title="Refresh Data"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid gap-6 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Complaints</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awaiting Resolution</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.pending}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950/40 dark:text-green-400">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Cases</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.resolved}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/40 dark:text-blue-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Resolution Time</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.avgTime} Days</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Ticket List */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">Department Complaints Queue</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading department queue...</div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No complaints registered in this department.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {complaints.map((c) => (
                <div key={c.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2.5">
                        <Link to={`/track-complaint/${c.id}`} className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{c.id}</Link>
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {c.citizenId ? `CUST-${String(c.citizenId).padStart(4, '0')}` : 'N/A (Anonymous)'}
                        </span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          c.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {c.priority}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Category: {c.category}</span>
                      </div>
                      <h4 className="text-md font-bold text-slate-800 dark:text-white mt-1">{c.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-355">{c.description}</p>
                      {c.address && <p className="text-[10px] text-slate-400 mt-1">Address: {c.address}</p>}
                      <p className="text-[10px] text-slate-450">Filed: {new Date(c.createdAt).toLocaleString()}</p>
                    </div>

                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                      c.status === 'SUBMITTED' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' :
                      c.status === 'ASSIGNED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                      c.status === 'RESOLVED' ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Actions for Dept Head / Switcher */}
                  <div className="border-t border-slate-50 pt-4 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Current Officer: <strong className="text-slate-600 dark:text-slate-200">{c.assignedOfficerName}</strong></span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* Change Status (Resolve) Dropdown */}
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 border border-slate-200 dark:border-slate-850">
                        <CheckIcon className="h-3.5 w-3.5 text-slate-400" />
                        <select
                          disabled={actioningId === c.id}
                          value={c.status}
                          onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                        >
                          <option value="SUBMITTED" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Submitted</option>
                          <option value="ASSIGNED" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Assigned</option>
                          <option value="IN_PROGRESS" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">In Progress</option>
                          <option value="RESOLVED" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Resolved</option>
                        </select>
                      </div>

                      {/* Officer Assignment Dropdown */}
                      {(c.status === 'SUBMITTED' || c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS') && (
                        <div className="flex gap-2">
                          <select 
                            value={assigningTo[c.id] || ''}
                            onChange={(e) => setAssigningTo({ ...assigningTo, [c.id]: e.target.value })}
                            className="rounded border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-800 dark:text-white"
                          >
                            <option value="">Select Officer...</option>
                            {officers.map(o => (
                              <option key={o.id} value={o.id}>{o.fullName} ({o.designation})</option>
                            ))}
                          </select>
                          <button 
                            disabled={actioningId === c.id}
                            onClick={() => handleAssign(c.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-blue-400"
                          >
                            Assign
                          </button>
                        </div>
                      )}

                      {/* Department Transfer Dropdown */}
                      {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED' && (
                        <div className="flex gap-2">
                          <select 
                            value={transferringTo[c.id] || ''}
                            onChange={(e) => setTransferringTo({ ...transferringTo, [c.id]: e.target.value })}
                            className="rounded border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-800 dark:text-white"
                          >
                            <option value="">Transfer Dept...</option>
                            {departments.filter(d => d.id !== Number(selectedDeptId)).map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <button 
                            disabled={actioningId === c.id}
                            onClick={() => handleTransfer(c.id)}
                            className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
                          >
                            Transfer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workload analysis chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Officer Workloads</h3>
          {workloadData.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No officers in department.</div>
          ) : (
            <div className="h-64 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="Workload" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeptHeadDashboard;
