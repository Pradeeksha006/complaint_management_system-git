import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Building2, UserCheck, Loader2, RefreshCw, Search, Filter, ClipboardList
} from 'lucide-react';

const AllComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, deptRes, offRes] = await Promise.all([
        api.get('/api/complaints?size=200'),
        api.get('/api/departments'),
        api.get('/api/users/officers')
      ]);
      setComplaints(compRes.data.content || []);
      setDepartments(deptRes.data || []);
      setOfficers(offRes.data || []);
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
      alert('Department re-assigned successfully!');
    } catch (err) {
      alert('Failed to transfer department: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOfficerAssign = async (complaintId, officerId) => {
    try {
      setUpdatingId(complaintId);
      await api.put(`/api/complaints/${complaintId}/assign?officerId=${officerId}`);
      // Refresh list
      const compRes = await api.get('/api/complaints?size=200');
      setComplaints(compRes.data.content || []);
      alert('Officer assigned successfully!');
    } catch (err) {
      alert('Failed to assign officer: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter complaints list locally
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.citizenName && c.citizenName.toLowerCase().includes(searchTerm.toLowerCase()));
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Transfer cases to respective departments or assign officers directly.</p>
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
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, title, or citizen..."
            className="w-full rounded-lg border border-slate-200 bg-transparent py-2 pl-10 pr-4 text-sm outline-none dark:border-slate-800 dark:text-white focus:border-blue-500"
          />
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

      {/* Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {filteredComplaints.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No complaints match your active filter search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Title & Citizen</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Route Department</th>
                  <th className="px-6 py-4">Assign Officer</th>
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
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-white max-w-sm truncate" title={c.title}>
                          {c.title}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          By: {c.isAnonymous ? 'Anonymous' : c.citizenName}
                        </div>
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
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <select
                            disabled={updatingId === c.id}
                            value={c.departmentId || ''}
                            onChange={(e) => handleDeptTransfer(c.id, Number(e.target.value))}
                            className="rounded border border-slate-200 bg-white py-1.5 px-2.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white max-w-[200px] focus:ring-1 focus:ring-blue-500"
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                          <select
                            disabled={updatingId === c.id}
                            value={c.assignedOfficerId || ''}
                            onChange={(e) => handleOfficerAssign(c.id, Number(e.target.value))}
                            className="rounded border border-slate-200 bg-white py-1.5 px-2.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-white max-w-[220px] focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">-- Choose Officer --</option>
                            {officers.map((o) => (
                              <option key={o.id} value={o.id} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                                {o.fullName} - {o.departmentName.replace('Department', '').trim()} ({o.designation})
                              </option>
                            ))}
                          </select>
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
