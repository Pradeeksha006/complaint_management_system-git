// src/pages/OfficersTable.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, RefreshCw } from 'lucide-react';

const OfficersTable = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(officers.length / itemsPerPage);
  const paginatedOfficers = officers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [officers, totalPages, currentPage]);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/officers/list');
      setOfficers(response.data);
    } catch (err) {
      console.error('Failed to fetch officers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Officer Directory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            List of all officers and their assigned departments.
          </p>
        </div>
        <button
          onClick={fetchOfficers}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          title="Refresh List"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Officers</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading officers...</div>
        ) : officers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No officers found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                    <th className="px-6 py-3">Officer ID</th>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {paginatedOfficers.map((off) => (
                    <tr key={off.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        OFF-{String(off.id).padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{off.username}</td>
                      <td className="px-6 py-4 text-slate-850 dark:text-white font-bold">{off.fullName}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-normal">{off.email}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-normal">
                        {off.departmentName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-normal">
                        {off.designation}
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
                  Showing <span className="font-semibold text-slate-800 dark:text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, officers.length)}</span> to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, officers.length)}</span> of <span className="font-semibold text-slate-800 dark:text-white">{officers.length}</span> officers
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${currentPage === p ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800'}`}
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
    </div>
  );
};

export default OfficersTable;
