import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, Loader2, RefreshCw, Search, Filter, ClipboardList, Sparkles, X, Users
} from 'lucide-react';

const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_URL || '';
  const cleaned = url.startsWith('/') ? url.substring(1) : url;
  return base.endsWith('/') ? `${base}${cleaned}` : `${base}/${cleaned}`;
};

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedSupportId, setExpandedSupportId] = useState(null);
  const [expandedComplaints, setExpandedComplaints] = useState({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const toggleComplaintExpand = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // AI Semantic search states
  const [semanticResults, setSemanticResults] = useState(null);
  const [searchingSemantic, setSearchingSemantic] = useState(false);

  const handleSemanticSearch = async () => {
    if (!searchTerm.trim()) {
      setSemanticResults(null);
      return;
    }
    setSearchingSemantic(true);
    try {
      const res = await api.get(`/api/ai/search?query=${encodeURIComponent(searchTerm)}`);
      setSemanticResults(res.data);
    } catch (err) {
      alert("AI Semantic search failed: " + err.message);
    } finally {
      setSearchingSemantic(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, deptRes] = await Promise.all([
        api.get('/api/complaints?size=200'),
        api.get('/api/departments')
      ]);
      setComplaints(compRes.data.content || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error('Error fetching complaints routing data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptTransfer = async (complaintId, targetDeptId) => {
    if (!targetDeptId) return;
    try {
      setUpdatingId(complaintId);
      await api.put(`/api/complaints/${complaintId}/transfer?targetDeptId=${targetDeptId}&remarks=Reassigned by Super Admin`);
      // Refresh list
      const compRes = await api.get('/api/complaints?size=200');
      setComplaints(compRes.data.content || []);
      alert('Department transferred successfully!');
    } catch (err) {
      alert('Failed to transfer department: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAiAutoRoute = async (complaintId) => {
    try {
      setUpdatingId(complaintId);
      const res = await api.put(`/api/complaints/${complaintId}/auto-route`);
      setComplaints(prev => prev.map(c => c.id === complaintId ? res.data : c));
      alert(`AI automatically routed the complaint to: ${res.data.departmentName}`);
    } catch (err) {
      alert('AI Auto-Routing failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter complaints list locally (supports search by Ticket ID, Customer ID, title, or citizen name)
  const activeList = semanticResults !== null ? semanticResults : complaints;

  const filteredComplaints = activeList.filter(c => {
    const customerIdStr = c.citizenId ? `cust-${String(c.citizenId).padStart(4, '0')}` : 'anonymous';
    const matchesSearch = semanticResults !== null ? true : (
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.citizenName && c.citizenName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      customerIdStr.includes(searchTerm.toLowerCase())
    );
    const matchesDept = filterDept ? c.departmentId === Number(filterDept) : true;
    const matchesStatus = filterStatus ? c.status === filterStatus : true;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredComplaints.length, totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDept, filterStatus, semanticResults]);

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading complaints control desk...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Complaint Routing Center
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Transfer cases to respective departments and monitor workflow timelines.</p>
        </div>
        <button 
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid gap-4 md:grid-cols-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Search */}
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value.trim()) {
                  setSemanticResults(null);
                }
              }}
              placeholder="Search or ask in natural language..."
              className="w-full rounded-lg border border-slate-200 bg-transparent py-2 pl-10 pr-4 text-sm outline-none dark:border-slate-800 dark:text-white focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSemanticSearch}
            disabled={searchingSemantic}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/10"
            title="Scan semantically with Gemini AI"
          >
            {searchingSemantic ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            )}
            AI Search
          </button>
        </div>

        {/* Dept Filter */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {semanticResults !== null && (
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/15 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/20 self-start animate-in fade-in-50 duration-150">
          <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
          <span>AI Semantic Search Active ({filteredComplaints.length} matches found)</span>
          <button
            onClick={() => {
              setSearchTerm('');
              setSemanticResults(null);
            }}
            className="text-slate-450 hover:text-slate-700 ml-1 rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Clear AI search filter"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {filteredComplaints.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No complaints match your active filter search.</div>
        ) : (
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
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                            #{c.id.substring(0, 8).toUpperCase()}
                          </span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                            c.status === 'RESOLVED' || c.status === 'CLOSED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">
                          {c.departmentName}
                        </span>
                      </div>
                      
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm md:text-md mt-1 leading-snug">
                          {c.title}
                        </h4>
                        <span className="text-[11.5px] text-slate-400 font-normal mt-1 block leading-none">
                          {new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content View */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              Customer Ref: {c.citizenId ? `CUST-${String(c.citizenId).padStart(4, '0')}` : 'Anonymous'}
                            </span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              c.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                              c.priority === 'HIGH' ? 'bg-orange-100 text-orange-855 dark:bg-orange-950/20 dark:text-orange-400' :
                              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {c.priority}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            {c.attachments && c.attachments.filter(att => att.fileType === 'IMAGE').length > 0 ? (
                              <img 
                                src={getFullUrl(c.attachments.filter(att => att.fileType === 'IMAGE')[0].fileUrl)} 
                                alt="Proof" 
                                className="h-12 w-12 object-cover rounded-md border border-slate-200 dark:border-slate-800 shrink-0" 
                              />
                            ) : (
                              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                                <ClipboardList className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">By: {c.isAnonymous ? 'Anonymous' : c.citizenName}</p>
                              {c.description && <p className="text-xs text-slate-650 dark:text-slate-300 mt-1 leading-relaxed">{c.description}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:justify-end shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setExpandedSupportId(expandedSupportId === c.id ? null : c.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-950/50"
                            >
                              <Users className="h-3.5 w-3.5" />
                              {c.supportCount || 1} {c.supportCount === 1 ? 'Citizen' : 'Citizens'}
                            </button>
                            {expandedSupportId === c.id && (
                              <div className="absolute right-0 mt-2 z-10 w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                {c.linkedCitizens && c.linkedCitizens.length > 0 ? (
                                  <div className="space-y-2">
                                    {c.linkedCitizens.map((citizen) => (
                                      <div key={`${c.id}-${citizen.id}-${citizen.sourceTicketId}`} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800">
                                        <div className="font-bold text-slate-800 dark:text-white">{citizen.fullName || 'N/A'}</div>
                                        <div className="break-all text-slate-500 dark:text-slate-400">{citizen.email || 'N/A'}</div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-slate-500 dark:text-slate-400">No registered citizen details available.</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {c.summary && (
                        <div className="rounded-lg bg-blue-50/25 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/10 p-2.5 flex items-start gap-2 text-xs text-blue-750 dark:text-blue-400 font-semibold leading-relaxed">
                          <Sparkles className="h-4 w-4 text-blue-650 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider block mb-0.5">AI Summary</span>
                            {c.summary}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                        <div className="text-xs text-slate-400">
                          Officer: {c.assignedOfficerName ? (
                            <strong className="text-slate-700 dark:text-slate-200">{c.assignedOfficerName}</strong>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                              Unassigned
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 items-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded px-2.5 py-1.5 border border-slate-200 dark:border-slate-850">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <select
                              disabled={updatingId === c.id}
                              value={c.departmentId || ''}
                              onChange={(e) => handleDeptTransfer(c.id, Number(e.target.value))}
                              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none max-w-[180px]"
                            >
                              {departments.map((d) => (
                                <option key={d.id} value={d.id} className="bg-white text-slate-850 dark:bg-slate-900 dark:text-slate-100">{d.name}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            disabled={updatingId === c.id}
                            onClick={() => handleAiAutoRoute(c.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1.5 text-xs font-bold transition-colors shadow-sm cursor-pointer"
                            title="Auto-route this complaint to the department predicted by AI"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                            AI Route
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800 dark:text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredComplaints.length)}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredComplaints.length)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{filteredComplaints.length}</span> complaints
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
      </div>
    </div>
  );
};

export default AllComplaints;
