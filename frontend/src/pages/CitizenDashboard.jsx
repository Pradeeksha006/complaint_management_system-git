import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Send, 
  Trash2, 
  FileWarning, 
  Plus, 
  Bot,
  MapPin,
  ArrowRight
} from 'lucide-react';
import ChatbotWidget from '../components/ChatbotWidget';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [complaints, setComplaints] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  useEffect(() => {
    fetchCitizenData();
    loadOfflineDrafts();
  }, []);

  const fetchCitizenData = async () => {
    try {
      setLoading(true);
      // Fetch citizen's complaints
      const response = await api.get(`/api/complaints?citizenId=${user.id}&size=5`);
      setComplaints(response.data.content);

      // Compute stats
      const allRes = await api.get(`/api/complaints?citizenId=${user.id}&size=100`);
      const all = allRes.data.content;
      setStats({
        total: all.length,
        pending: all.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED').length,
        resolved: all.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length
      });
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineDrafts = () => {
    const saved = localStorage.getItem('offline_drafts');
    if (saved) {
      setDrafts(JSON.parse(saved));
    }
  };

  const deleteDraft = (index) => {
    const updated = [...drafts];
    updated.splice(index, 1);
    setDrafts(updated);
    localStorage.setItem('offline_drafts', JSON.stringify(updated));
  };

  const submitDraft = async (draft, index) => {
    try {
      const formData = new FormData();
      formData.append('title', draft.title || '');
      formData.append('description', draft.description || '');
      formData.append('category', draft.category || 'Auto');
      
      const isAnon = draft.isAnonymous ? 'true' : 'false';
      formData.append('isAnonymous', isAnon);

      if (draft.latitude !== undefined && draft.latitude !== null && draft.latitude !== '') {
        formData.append('latitude', draft.latitude.toString());
      }
      if (draft.longitude !== undefined && draft.longitude !== null && draft.longitude !== '') {
        formData.append('longitude', draft.longitude.toString());
      }
      if (draft.address) {
        formData.append('address', draft.address);
      }
      if (draft.departmentId && draft.departmentId !== 'null' && draft.departmentId !== 'undefined' && draft.departmentId !== '') {
        formData.append('departmentId', draft.departmentId.toString());
      }

      await api.post('/api/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      deleteDraft(index);
      fetchCitizenData();
    } catch (err) {
      alert('Failed to sync draft: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Citizen Console</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">File complaints, track progress, and view resolution histories.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/file-complaint"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            File Complaint
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Complaints</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.total}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Resolution</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.pending}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-950/40 dark:text-green-400">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Cases</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.resolved}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Drafts Panel */}
      {drafts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-6 dark:border-amber-900/30 dark:bg-amber-950/5">
          <h3 className="flex items-center gap-2 text-md font-bold text-amber-800 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Offline Drafts ({drafts.length})
          </h3>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            These complaints were drafted while you were offline. Click sync to register them now.
          </p>
          <div className="mt-4 space-y-3">
            {drafts.map((draft, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 border border-amber-100 dark:bg-slate-900 dark:border-slate-800"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{draft.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{draft.description}</p>
                  {draft.address && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                      <MapPin className="h-3 w-3" />
                      {draft.address}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => submitDraft(draft, idx)}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow-sm transition-all shrink-0"
                    title="Sync/Publish"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Sync Now
                  </button>
                  <button 
                    onClick={() => deleteDraft(idx)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 text-red-650 hover:bg-red-100 px-3.5 py-2 text-xs font-bold dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors shrink-0"
                    title="Delete Draft"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Complaints Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Recent Complaints</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <FileWarning className="h-10 w-10 text-slate-400" />
            <p className="text-sm">You haven't filed any complaints yet.</p>
            <Link to="/file-complaint" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">File your first case</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{c.id}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200 max-w-xs truncate">{c.title}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{c.departmentName}</td>
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
      </div>

    </div>
  );
};

export default CitizenDashboard;
