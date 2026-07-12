import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  FolderLock, CheckCircle, Flame, ShieldAlert, Loader2, ArrowRight, Upload, AlertTriangle
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedComplaints, setExpandedComplaints] = useState({});
  const [complaintView, setComplaintView] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const toggleComplaintExpand = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // Update progress modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('IN_PROGRESS');
  const [remarks, setRemarks] = useState('');
  const [workFile, setWorkFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOfficerData();
  }, []);

  const fetchOfficerData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/complaints?officerId=${user.id}`);
      const list = response.data.content;
      setComplaints(list);

      setStats({
        assigned: list.filter(c => c.status === 'ASSIGNED').length,
        inProgress: list.filter(c => c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS').length,
        resolved: list.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length
      });
    } catch (err) {
      console.error('Error fetching officer assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      const formData = new FormData();
      formData.append('status', 'ACCEPTED');
      formData.append('remarks', 'Officer accepted the complaint and started review.');
      await api.put(`/api/complaints/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchOfficerData();
    } catch (err) {
      alert('Failed to accept complaint: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('status', updateStatus);
      formData.append('remarks', remarks);
      if (workFile) {
        formData.append('workFile', workFile);
      }

      await api.put(`/api/complaints/${selectedComplaint.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSelectedComplaint(null);
      setRemarks('');
      setWorkFile(null);
      fetchOfficerData();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const isNearDeadline = (c) => {
    if (c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'REJECTED') {
      return false;
    }
    if (c.priority === 'CRITICAL') {
      return true;
    }
    if (!c.deadline) {
      return false;
    }
    const deadlineTime = new Date(c.deadline).getTime();
    const now = Date.now();
    const hoursLeft = (deadlineTime - now) / (1000 * 60 * 60);
    return hoursLeft <= 4;
  };

  const urgentCount = complaints.filter(c => isNearDeadline(c)).length;

  const visibleComplaints = complaints.filter(c => {
    if (complaintView === 'assigned') {
      return c.status === 'ASSIGNED';
    }
    if (complaintView === 'inProgress') {
      return c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS';
    }
    if (complaintView === 'resolved') {
      return c.status === 'RESOLVED' || c.status === 'CLOSED';
    }
    if (complaintView === 'urgent') {
      return isNearDeadline(c);
    }
    return true;
  });

  const totalPages = Math.ceil(visibleComplaints.length / itemsPerPage);
  const paginatedComplaints = visibleComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [visibleComplaints.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [complaintView]);

  const queueTitle = complaintView === 'assigned'
    ? 'Assigned Task Queue'
    : complaintView === 'inProgress'
      ? 'In Progress Work'
      : complaintView === 'resolved'
        ? 'Resolved Tickets'
        : complaintView === 'urgent'
          ? 'Urgent & Critical (Near Deadline)'
          : 'All Assignments';

  // Dummy monthly resolution rate for chart representation
  const chartData = [
    { name: 'Jan', Resolved: 4 },
    { name: 'Feb', Resolved: 6 },
    { name: 'Mar', Resolved: 9 },
    { name: 'Apr', Resolved: 12 },
    { name: 'May', Resolved: 8 },
    { name: 'Jun', Resolved: stats.resolved },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Officer Hub</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resolve assigned issues, submit closure reports, and track resolutions.</p>
      </div>

      {/* KPI */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <button 
          type="button" 
          onClick={() => setComplaintView(complaintView === 'assigned' ? 'all' : 'assigned')} 
          className={`rounded-xl border p-6 text-left shadow-sm transition-all duration-200 cursor-pointer ${
            complaintView === 'assigned' 
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/5 dark:bg-blue-950/10' 
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FolderLock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Task Queue</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.assigned}</h3>
            </div>
          </div>
        </button>

        <button 
          type="button" 
          onClick={() => setComplaintView(complaintView === 'inProgress' ? 'all' : 'inProgress')} 
          className={`rounded-xl border p-6 text-left shadow-sm transition-all duration-200 cursor-pointer ${
            complaintView === 'inProgress' 
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/5 dark:bg-amber-950/10' 
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Progress Work</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.inProgress}</h3>
            </div>
          </div>
        </button>

        <button 
          type="button" 
          onClick={() => setComplaintView(complaintView === 'resolved' ? 'all' : 'resolved')} 
          className={`rounded-xl border p-6 text-left shadow-sm transition-all duration-200 cursor-pointer ${
            complaintView === 'resolved' 
              ? 'border-green-500 ring-2 ring-green-500/20 bg-green-50/5 dark:bg-green-950/10' 
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.resolved}</h3>
            </div>
          </div>
        </button>

        <button 
          type="button" 
          onClick={() => setComplaintView(complaintView === 'urgent' ? 'all' : 'urgent')} 
          className={`rounded-xl border p-6 text-left shadow-sm transition-all duration-200 cursor-pointer relative overflow-hidden ${
            complaintView === 'urgent' 
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/5 dark:bg-red-950/10' 
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-50 p-3 text-red-650 dark:bg-red-950/40 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                Urgent Action
                {urgentCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{urgentCount}</h3>
            </div>
          </div>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Work items list */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">{queueTitle}</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading assignments...</div>
          ) : visibleComplaints.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <FolderLock className="h-10 w-10 text-slate-400" />
              <p className="text-sm">No assignments found for you under this filter.</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 space-y-4 rounded-b-xl border-t border-slate-200 dark:border-slate-850">
                {paginatedComplaints.map((c) => {
                const isExpanded = !!expandedComplaints[c.id];
                return (
                  <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    {/* Clickable Header showing ID & Title */}
                    <div 
                      onClick={() => toggleComplaintExpand(c.id)}
                      className="p-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/10 flex items-center justify-between gap-4 select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2.5">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{c.id}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            c.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {c.priority}
                          </span>
                        </div>
                        <h4 className="text-md font-bold text-slate-800 dark:text-white mt-1">{c.title}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          c.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                        <svg 
                          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{c.description}</p>
                        <p className="text-[10px] text-slate-450">Location: {c.address || 'Not specified'}</p>
                        
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

                        <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                          <p className="text-[10px] text-slate-450">Filed: {new Date(c.createdAt).toLocaleString()}</p>
                          
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {c.status === 'ASSIGNED' ? (
                              <>
                                <button 
                                  onClick={() => handleAccept(c.id)}
                                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                                >
                                  Accept
                                </button>
                                <Link 
                                  to={`/track-complaint/${c.id}`}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 shadow-sm"
                                >
                                  Track Page →
                                </Link>
                              </>
                            ) : c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED' ? (
                              <>
                                <button 
                                  onClick={() => setSelectedComplaint(c)}
                                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 cursor-pointer"
                                >
                                  Update Status
                                </button>
                                <Link 
                                  to={`/track-complaint/${c.id}`}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 shadow-sm"
                                >
                                  Track Page →
                                </Link>
                              </>
                            ) : (
                              <Link 
                                to={`/track-complaint/${c.id}`}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 shadow-sm"
                              >
                                Track Page →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-800 dark:text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, visibleComplaints.length)}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, visibleComplaints.length)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{visibleComplaints.length}</span> complaints
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
          </>)}
        </div>

        {/* Recharts Analytics Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Resolution Analytics</h3>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="Resolved" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Update Progress Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Update Progress: {selectedComplaint.id}</h3>
            
            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Status</label>
                <select 
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800 dark:text-white"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_FOR_CITIZEN">Waiting for Citizen Input</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks / Details</label>
                <textarea 
                  required
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Detail operations performed, actions taken, or items outstanding..."
                  className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-sm dark:border-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Completion Image (Optional)</label>
                <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select work completion image</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setWorkFile(e.target.files[0])}
                    className="hidden" 
                  />
                  {workFile && <span className="text-xs font-semibold text-blue-600 mt-2">{workFile.name}</span>}
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
