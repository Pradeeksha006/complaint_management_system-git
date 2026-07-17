// src/pages/OfficerDeptList.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, RefreshCw } from 'lucide-react';

/**
 * Component to display all officers grouped by their department.
 * Used on the Superadmin (AdminDashboard) page to give a quick overview
 * of officer distribution across departments. The component does not alter
 * any existing dashboard logic – it simply fetches data and renders it.
 */
const OfficerDeptList = () => {
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state – each department table gets its own pagination
  const itemsPerPage = 5;
  const [pageMap, setPageMap] = useState({}); // {deptId: currentPage}

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, officerRes] = await Promise.all([
        api.get('/api/departments'),
        api.get('/api/users/officers')
      ]);
      setDepartments(deptRes.data || []);
      setOfficers(officerRes.data || []);
    } catch (err) {
      console.error('Error loading officer/dept data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const grouped = departments.map((dept) => {
    const deptOfficers = officers.filter((o) => o.departmentId == dept.id || o.deptId == dept.id);
    const totalPages = Math.ceil(deptOfficers.length / itemsPerPage);
    const currentPage = pageMap[dept.id] || 1;
    const paginated = deptOfficers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
    return {
      dept,
      officers: paginated,
      totalPages,
      currentPage,
      totalCount: deptOfficers.length
    };
  });

  const setPage = (deptId, page) => {
    setPageMap((prev) => ({ ...prev, [deptId]: page }));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
        Loading officer directory...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <button
          onClick={fetchData}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {grouped.map(({ dept, officers: offs, totalPages, currentPage, totalCount }) => (
        <div key={dept.id} className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
            {dept.name} ({totalCount})
          </h3>
          {totalCount === 0 ? (
            <p className="text-sm text-slate-500">No officers assigned.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-white">Officers</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Username</th>
                      <th className="px-6 py-3">Full Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Designation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {offs.map((off) => (
                      <tr key={off.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          OFF-{String(off.id).padStart(4, '0')}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{off.username}</td>
                        <td className="px-6 py-4 text-slate-850 dark:text-white font-bold">{off.fullName}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-normal">{off.email}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-normal">{off.designation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10">
                  <p className="text-xs text-slate-500">
                    Showing <span className="font-semibold text-slate-800 dark:text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span>
                    to <span className="font-semibold text-slate-800 dark:text-white">{Math.min(currentPage * itemsPerPage, totalCount)}</span>
                    of <span className="font-semibold text-slate-800 dark:text-white">{totalCount}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setPage(dept.id, Math.max(currentPage - 1, 1))}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(dept.id, p)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${currentPage === p ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(dept.id, Math.min(currentPage + 1, totalPages))}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OfficerDeptList;
