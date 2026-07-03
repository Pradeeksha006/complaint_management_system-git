import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, FolderSearch } from 'lucide-react';

const TrackingPage = () => {
  const [complaintId, setComplaintId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (complaintId.trim()) {
      navigate(`/track-complaint/${complaintId.trim()}`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8 py-12">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
          <FolderSearch className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Track Your Complaint</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review live resolution logs, operations timeline, and status updates.</p>
      </div>

      {/* Input */}
      <form onSubmit={handleSearch} className="rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Complaint ID / Reference Number</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              required
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="e.g. WT-20260703-0001"
              className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-colors dark:border-slate-800 dark:text-white focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10"
        >
          Track Ticket
        </button>
      </form>
    </div>
  );
};

export default TrackingPage;
