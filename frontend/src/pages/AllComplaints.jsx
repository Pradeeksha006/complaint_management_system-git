import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, Loader2, RefreshCw, Search, Filter, ClipboardList, Sparkles, X, Users
} from 'lucide-react';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Customer ID</th>
                  <th className="px-6 py-4">Title & Citizen</th>
                  <th className="px-6 py-4">Support Count</th>
                  <th className="px-6 py-4 text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" /> AI Summary
                    </span>
                  </th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Assigned Officer</th>
                  <th className="px-6 py-4">Transfer Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredComplaints.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        <Link to={`/track-complaint/${c.id}`} className="hover:underline">
                          {c.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-800 dark:text-white">
                        {c.citizenId ? `CUST-${String(c.citizenId).padStart(4, '0')}` : 'N/A (Anonymous)'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-white max-w-sm truncate" title={c.translatedTitle && c.translatedTitle !== c.title ? `${c.translatedTitle} (Original: ${c.title})` : c.title}>
                          {c.translatedTitle && c.translatedTitle !== c.title ? c.translatedTitle : c.title}
                          {c.translatedTitle && c.translatedTitle !== c.title && (
                            <span className="ml-1 text-[10px] font-bold text-blue-500">(AI Translated)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          By: {c.isAnonymous ? 'Anonymous' : c.citizenName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 text-xs font-bold">
                          <Users className="h-3.5 w-3.5" />
                          {c.supportCount || 1} {c.supportCount === 1 ? 'Citizen' : 'Citizens'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-200 max-w-xs truncate" title={c.summary}>
                        {c.summary || 'Generating...'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold ${
                          c.status === 'SUBMITTED' ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' :
                          c.status === 'ASSIGNED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                          c.status === 'RESOLVED' ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' :
                          'bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.assignedOfficerName ? (
                          <span className="font-semibold text-slate-800 dark:text-white">
                            {c.assignedOfficerName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-bold">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <select
                            disabled={updatingId === c.id}
                            value={c.departmentId || ''}
                            onChange={(e) => handleDeptTransfer(c.id, Number(e.target.value))}
                            className="rounded border border-slate-200 bg-white py-1.5 px-2.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white max-w-[180px] focus:ring-1 focus:ring-blue-500"
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">{d.name}</option>
                            ))}
                          </select>
                          <button
                            disabled={updatingId === c.id}
                            onClick={() => handleAiAutoRoute(c.id)}
                            className="inline-flex items-center gap-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-1.5 text-xs font-bold transition-colors"
                            title="Auto-route this complaint to the department predicted by AI"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Route
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllComplaints;
