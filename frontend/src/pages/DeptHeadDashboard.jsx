import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Inbox, UserCheck, Clock, CheckSquare, Loader2, RefreshCcw
} from 'lucide-react';

const DeptHeadDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, avgTime: 0 });
  const [loading, setLoading] = useState(true);

  // Transfer and Assignment States
  const [assigningTo, setAssigningTo] = useState({}); // complaintId -> officerId
  const [transferringTo, setTransferringTo] = useState({}); // complaintId -> deptId
  const [transferRemarks, setTransferRemarks] = useState({}); // complaintId -> remarks
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchDeptData();
  }, []);

  const fetchDeptData = async () => {
    try {
      setLoading(true);
      // Fetch department complaints
      const response = await api.get(`/api/complaints?deptId=${user.departmentId}`);
      const list = response.data.content;
      setComplaints(list);

      // Fetch officers
      const offRes = await api.get('/api/users/officers');
      // Filter officers belonging to this department
      setOfficers(offRes.data.filter(o => o.departmentId === user.departmentId));

      // Fetch departments for transfer
      const deptRes = await api.get('/api/departments');
      setDepartments(deptRes.data.filter(d => d.id !== user.departmentId));

      // Compute statistics
      const resolved = list.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      setStats({
        total: list.length,
        pending: list.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED').length,
        resolved: resolved,
        avgTime: 2.4 // Mock average days resolution
      });
    } catch (err) {
      console.error('Error fetching department dashboard details', err);
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
      fetchDeptData();
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
      fetchDeptData();
    } catch (err) {
      alert('Failed to transfer: ' + (err.response?.data?.message || err.message));
    } finally {
      setActioningId(null);
    }
  };

  // Compile Chart data for Officer workload
  const getWorkloadData = () => {
    return officers.map(o => {
      const assignedCount = complaints.filter(c => c.assignedOfficerId === o.id).length;
      return {
        name: o.fullName.split(' ')[0], // First name
        Workload: assignedCount
      };
    });
  };

  const workloadData = getWorkloadData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Department Head Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor departmental activities, allocate tasks, and transfer tickets.</p>
        </div>
        <button 
          onClick={fetchDeptData}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          title="Refresh Data"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
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
            <div className="rounded-lg bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
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
            <div className="p-12 text-center text-slate-500">No complaints registered in your department.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {complaints.map((c) => (
                <div key={c.id} className="p-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{c.id}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {c.priority}
                      </span>
                      <span className="text-xs text-slate-400">Category: {c.category}</span>
                    </div>
                    <h4 className="text-md font-bold text-slate-800 dark:text-white mt-2">{c.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.description}</p>
                    <p className="text-[10px] text-slate-400 mt-2">Address: {c.address || 'Geo-Coordinates'}</p>
                    <p className="text-[10px] text-slate-400">Filed: {new Date(c.createdAt).toLocaleString()}</p>
                  </div>

                  {/* Actions for Dept Head */}
                  <div className="mt-4 border-t border-slate-50 pt-4 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Current Officer: <strong className="text-slate-600 dark:text-slate-200">{c.assignedOfficerName}</strong></span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* Officer Assignment Dropdown */}
                      {c.status === 'SUBMITTED' || c.status === 'ESCALATED' ? (
                        <div className="flex gap-2">
                          <select 
                            value={assigningTo[c.id] || ''}
                            onChange={(e) => setAssigningTo({ ...assigningTo, [c.id]: e.target.value })}
                            className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-800 dark:text-white"
                          >
                            <option value="">Select Officer...</option>
                            {officers.map(o => (
                              <option key={o.id} value={o.id}>{o.fullName} ({o.designation})</option>
                            ))}
                          </select>
                          <button 
                            disabled={actioningId === c.id}
                            onClick={() => handleAssign(c.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 disabled:bg-blue-400"
                          >
                            {actioningId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Assign'}
                          </button>
                        </div>
                      ) : null}

                      {/* Department Transfer Option */}
                      {c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED' ? (
                        <div className="flex gap-2">
                          <select 
                            value={transferringTo[c.id] || ''}
                            onChange={(e) => setTransferringTo({ ...transferringTo, [c.id]: e.target.value })}
                            className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-800 dark:text-white"
                          >
                            <option value="">Transfer Dept...</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <button 
                            disabled={actioningId === c.id}
                            onClick={() => handleTransfer(c.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
                          >
                            {actioningId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Transfer'}
                          </button>
                        </div>
                      ) : null}
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
                  <Bar dataKey="Workload" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
