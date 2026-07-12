import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Building2, Plus, Trash2, Loader2, CheckCircle2, ShieldAlert, RefreshCw 
} from 'lucide-react';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(departments.length / itemsPerPage);
  const paginatedDepts = departments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [departments, totalPages, currentPage]);

  useEffect(() => {
    fetchDepts();
  }, []);

  const fetchDepts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Error loading departments list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setActionLoading(true);
    try {
      await api.post('/api/departments', { name, code, description });
      setName('');
      setCode('');
      setDescription('');
      fetchDepts();
    } catch (err) {
      alert('Failed to register department: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This cannot be undone.')) return;
    try {
      await api.delete(`/api/departments/${id}`);
      fetchDepts();
    } catch (err) {
      alert('Failed to delete department: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Department Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Establish organization and government department records, allocate codes, and descriptions.</p>
        </div>
        <button 
          onClick={fetchDepts}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Department Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white">Registered Departments</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading departments...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                      <th className="px-6 py-3">Code</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {paginatedDepts.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{d.code}</td>
                        <td className="px-6 py-4 text-slate-800 dark:text-white">{d.name}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{d.description || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDeleteDept(d.id)}
                            className="text-red-600 hover:text-red-800 p-1.5 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 dark:hover:bg-red-950/20"
                            title="Delete Department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                  <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-800 dark:text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, departments.length)}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, departments.length)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{departments.length}</span> departments
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
            </>
          )}
        </div>

        {/* Add department form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-fit space-y-4">
          <h3 className="flex items-center gap-2 text-md font-bold text-slate-800 dark:text-white">
            <Building2 className="h-5 w-5 text-blue-600" />
            Register Department
          </h3>
          <p className="text-xs text-slate-500">Add a new organization or government vertical with its unique tracking code prefix.</p>

          <form onSubmit={handleAddDept} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department Name</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Water Resources Department"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tracking Prefix Code</label>
              <input 
                type="text"
                required
                maxLength={5}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. WT (Max 5 chars)"
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Brief Description</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key roles, responsibilities, contact notes..."
                className="w-full rounded-lg border border-slate-200 bg-transparent p-2.5 text-xs dark:border-slate-800 dark:text-white focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Department'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DepartmentManagement;
