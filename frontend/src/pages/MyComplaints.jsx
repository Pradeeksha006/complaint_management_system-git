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
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const toggleComplaintExpand = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

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
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 space-y-4 rounded-b-xl border-t border-slate-200 dark:border-slate-850">
            {complaints.map((c) => {
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
                      </div>
                      <h4 className="text-md font-bold text-slate-800 dark:text-white mt-1">{c.title}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.status === 'RESOLVED' || c.status === 'CLOSED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                          : c.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-850 dark:bg-blue-950/30 dark:text-blue-400'
                          : c.status === 'REJECTED'
                          ? 'bg-red-100 text-red-850 dark:bg-red-950/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-850 dark:bg-amber-950/30 dark:text-amber-400'
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center flex-wrap gap-2.5">
                            <span className="text-xs text-slate-400">Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              c.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' : 
                              c.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' :
                              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {c.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {c.attachments && c.attachments.filter(att => att.fileType === 'IMAGE').length > 0 ? (
                              <img 
                                src={c.attachments.filter(att => att.fileType === 'IMAGE')[0].fileUrl} 
                                alt="Proof" 
                                className="h-12 w-12 object-cover rounded-md border border-slate-200 dark:border-slate-800 shrink-0" 
                              />
                            ) : (
                              <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800">
                                <FileText className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.departmentName}</p>
                              {c.description && <p className="text-xs text-slate-650 dark:text-slate-300 mt-1 leading-relaxed">{c.description}</p>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end shrink-0 pt-3 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                          <Link 
                            to={`/track-complaint/${c.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 shadow-sm cursor-pointer"
                          >
                            Track Progress
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
