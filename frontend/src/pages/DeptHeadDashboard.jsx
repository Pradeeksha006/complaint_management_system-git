import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Inbox, UserCheck, Clock, CheckSquare, Loader2, RefreshCcw, Building2, Sparkles
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

  const handleAssign = async (complaintId, officerId) => {
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

  // Compile list data for Officer workload
  const getWorkloadData = () => {
    return officers.map(o => {
      const assignedCount = complaints.filter(c => c.assignedOfficerId === o.id && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
      return {
        ...o,
        workloadCount: assignedCount
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
                      </div>
                      <h4 className="text-md font-bold text-slate-800 dark:text-white mt-1" title={c.translatedTitle && c.translatedTitle !== c.title ? `Original: ${c.title}` : ""}>
                        {c.translatedTitle && c.translatedTitle !== c.title ? c.translatedTitle : c.title}
                        {c.translatedTitle && c.translatedTitle !== c.title && (
                          <span className="ml-1.5 text-[9px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded">(AI Translated Title)</span>
                        )}
                      </h4>
                      <div className="text-xs text-slate-650 dark:text-slate-300 font-medium space-y-1 mt-1">
                        <p>{c.translatedDescription && c.translatedDescription !== c.description ? c.translatedDescription : c.description}</p>
                        {c.translatedDescription && c.translatedDescription !== c.description && (
                          <span className="block text-[9px] font-semibold text-slate-400 italic">Original text: "{c.description}"</span>
                        )}
                      </div>
                      {c.address && <p className="text-[10px] text-slate-400 mt-2">Address: {c.address}</p>}
                      {c.summary && (
                        <div className="rounded-lg bg-blue-50/25 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/10 p-2.5 flex items-start gap-2 text-xs text-blue-750 dark:text-blue-400 font-semibold leading-relaxed mt-2.5">
                          <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider block mb-0.5">AI Summary</span>
                            {c.summary}
                          </div>
                        </div>
                      )}
                      
                      {/* Direct inline attachments preview */}
                      {c.attachments && c.attachments.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto py-1 shrink-0">
                          {c.attachments.map((att) => (
                            <a 
                              key={att.id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 group hover:border-blue-500 transition-colors"
                              title="Click to view file"
                            >
                              {att.fileType === 'IMAGE' ? (
                                <img src={att.fileUrl} alt="Preview" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[9px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-850">
                                  {att.fileType}
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-[10px] text-slate-450 mt-2">Filed: {new Date(c.createdAt).toLocaleString()}</p>
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
                      <span className="text-xs text-slate-400">
                        Current Officer: {c.assignedOfficerName ? (
                          <strong className="text-slate-700 dark:text-slate-200">{c.assignedOfficerName}</strong>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                            Unassigned
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {user?.role === 'ROLE_ADMIN' ? (
                        <span className="text-xs text-slate-400 font-semibold italic bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded">
                          View Only Mode (Admin)
                        </span>
                      ) : (
                        <>
                          {/* Assign Officer Dropdown */}
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 border border-slate-200 dark:border-slate-850">
                            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                            <select
                              disabled={actioningId === c.id}
                              value={c.assignedOfficerId || ''}
                              onChange={(e) => handleAssign(c.id, e.target.value)}
                              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                            >
                              <option value="">-- Assign Officer --</option>
                              {officers.map(o => (
                                <option key={o.id} value={o.id} className="bg-white text-slate-850 dark:bg-slate-900 dark:text-slate-100">
                                  {o.fullName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Change Status Dropdown */}
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 border border-slate-200 dark:border-slate-850">
                            <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workload analysis list */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-fit">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Officer Workloads</h3>
          {workloadData.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No officers in department.</div>
          ) : (
            <div className="space-y-4">
              {workloadData.map(o => {
                const percentage = Math.min((o.workloadCount / 5) * 100, 100);
                const getStatusPill = (count) => {
                  if (count === 0) return { label: 'Idle', style: 'bg-slate-50 text-slate-600 dark:bg-slate-950/20 dark:text-slate-400' };
                  if (count <= 2) return { label: 'Optimal', style: 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-455' };
                  if (count <= 4) return { label: 'Medium', style: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-455' };
                  return { label: 'Overloaded', style: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-455 animate-pulse' };
                };
                const status = getStatusPill(o.workloadCount);
                const initials = o.fullName ? o.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'OF';

                return (
                  <div key={o.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-450 text-xs font-bold">
                          {initials.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{o.fullName}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{o.designation || 'Officer'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${status.style}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        <span>Active Tickets</span>
                        <span>{o.workloadCount} Cases</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            o.workloadCount <= 2 ? 'bg-green-500' :
                            o.workloadCount <= 4 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeptHeadDashboard;
