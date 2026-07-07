import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  FileText, ShieldAlert, ArrowRight, Eye, ClipboardX, Loader2
} from 'lucide-react';

const MyComplaints = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMyComplaints();
  }, [page]);

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/complaints?citizenId=${user.id}&page=${page}&size=10`);
      setComplaints(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Error fetching citizen complaints', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">My Filed Complaints</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Review, print records, and view the progress of your submitted complaints.</p>
      </div>

      {/* Table grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <p className="text-sm">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-4">
            <ClipboardX className="h-10 w-10 text-slate-400" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">No active complaints found</p>
              <p className="text-xs text-slate-400 mt-1">You haven't submitted any complaints under this account.</p>
            </div>
            <Link to="/file-complaint" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
              File a Complaint
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                  <th className="px-6 py-3">ID Reference</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{c.id}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200 max-w-xs">
                      <div className="flex items-center gap-3">
                        {c.attachments && c.attachments.filter(att => att.fileType === 'IMAGE').length > 0 ? (
                          <img 
                            src={c.attachments.filter(att => att.fileType === 'IMAGE')[0].fileUrl} 
                            alt="Proof" 
                            className="h-10 w-10 object-cover rounded-md border border-slate-200 dark:border-slate-800 shrink-0" 
                          />
                        ) : (
                          <div className="h-10 w-10 bg-slate-105 dark:bg-slate-800 rounded-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                            <FileText className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <span className="truncate">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{c.departmentName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.priority === 'CRITICAL' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' 
                          : c.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.status === 'RESOLVED' || c.status === 'CLOSED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                          : c.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                          : c.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/track-complaint/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Track
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <button 
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400">Page {page + 1} of {totalPages}</span>
            <button 
              disabled={page === totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
