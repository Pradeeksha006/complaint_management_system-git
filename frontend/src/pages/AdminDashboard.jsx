import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Inbox, Clock, CheckCircle, Star, TrendingUp, Users, Building2, ShieldCheck,
  Loader2, RefreshCw, FileText, Layers
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [complaintView, setComplaintView] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendType, setTrendType] = useState('month'); // 'day' | 'week' | 'month'

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, compRes] = await Promise.all([
        api.get('/api/analytics/dashboard'),
        api.get('/api/complaints?size=200')
      ]);
      setStats(statsRes.data);
      const complaintList = compRes.data.content || [];
      setAllComplaints(complaintList);
      setRecentComplaints(complaintList.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard statistics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading system metrics and analytics...
      </div>
    );
  }

  // Format department data for "Filed Complaints"
  const getFiledDeptData = () => {
    if (!stats?.departmentWise) return [];
    return Object.keys(stats.departmentWise).map(key => ({
      name: key.replace('Department', '').trim(),
      "Filed Complaints": stats.departmentWise[key]
    }));
  };

  // Format department data for "Resolved Complaints"
  const getResolvedDeptData = () => {
    if (!stats?.resolvedDepartmentWise) return [];
    return Object.keys(stats.resolvedDepartmentWise).map(key => ({
      name: key.replace('Department', '').trim(),
      "Resolved Complaints": stats.resolvedDepartmentWise[key]
    }));
  };

  const filedDeptData = getFiledDeptData();
  const resolvedDeptData = getResolvedDeptData();
  
  const getActiveTrends = () => {
    if (trendType === 'day') return stats?.dailyTrends || [];
    if (trendType === 'week') return stats?.weeklyTrends || [];
    return stats?.monthlyTrends || [];
  };
  const activeTrends = getActiveTrends();
  const visibleComplaints = complaintView === 'merged'
    ? allComplaints.filter((c) => c.masterComplaintId || (c.supportCount || 1) > 1)
    : complaintView === 'citizens'
      ? allComplaints
      : recentComplaints;
  const complaintPanelTitle = complaintView === 'merged'
    ? 'Merged Complaint Reports'
    : complaintView === 'citizens'
      ? 'Citizen Filed Reports'
      : 'Recent Activity';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Admin Control Tower</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time system monitoring, department workloads, and recent cases.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
          <Link to="/all-complaints" className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10">
            <Building2 className="h-3.5 w-3.5" />
            Complaint Router
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-7">
        <button type="button" onClick={() => setComplaintView('recent')} className="rounded-xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:border-blue-300 dark:hover:border-blue-700">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <Inbox className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Incidents</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">{stats?.totalIncidents ?? (stats?.totalComplaints || 0)}</h3>
        </button>

        <button type="button" onClick={() => setComplaintView('citizens')} className="rounded-xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700">
          <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Citizen Reports</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">{stats?.totalComplaints || 0}</h3>
        </button>

        <button type="button" onClick={() => setComplaintView('merged')} className="rounded-xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Layers className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Merged Reports</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">{stats?.mergedReports || 0}</h3>
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">
            {(stats?.statusWise?.ASSIGNED || 0) + (stats?.statusWise?.IN_PROGRESS || 0) + (stats?.statusWise?.ACCEPTED || 0)}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">
            {(stats?.statusWise?.RESOLVED || 0) + (stats?.statusWise?.CLOSED || 0)}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
            <Star className="h-5 w-5 fill-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rating</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">{stats?.averageSatisfaction || 0.0} / 5</h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <TrendingUp className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Resolution</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">{stats?.averageResolutionTimeDays || 0.0} Days</h3>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-2">

        {/* Registration & Resolution Trends */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">
              {trendType === 'day' ? 'Daily' : trendType === 'week' ? 'Weekly' : 'Monthly'} Registration & Resolution Trends
            </h3>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setTrendType('day')}
                className={`rounded-md px-3 py-1 text-[10px] font-bold transition-all ${
                  trendType === 'day'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTrendType('week')}
                className={`rounded-md px-3 py-1 text-[10px] font-bold transition-all ${
                  trendType === 'week'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTrendType('month')}
                className={`rounded-md px-3 py-1 text-[10px] font-bold transition-all ${
                  trendType === 'month'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Month
              </button>
            </div>
          </div>
          {activeTrends.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No trend logs recorded yet.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activeTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Filed" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="Pending" stroke="#f59e0b" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Complaints Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white">{complaintPanelTitle}</h3>
          <Link to="/all-complaints" className="text-xs font-semibold text-blue-600 hover:underline">
            View All Complaints →
          </Link>
        </div>

        {visibleComplaints.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">No complaints registered in the system yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      <Link to={`/track-complaint/${c.id}`} className="hover:underline">
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-white max-w-xs truncate">{c.title}</div>
                      <div className="text-xs text-slate-400">By: {c.isAnonymous ? 'Anonymous' : c.citizenName}</div>
                      {complaintView === 'citizens' && (
                        <div className="text-xs text-slate-400">
                          {c.citizenId ? `CUST-${String(c.citizenId).padStart(4, '0')}` : 'Anonymous'} · {c.citizenEmail || 'N/A'}
                        </div>
                      )}
                      {complaintView === 'merged' && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          {(c.supportCount || 1)} linked reports{c.masterComplaintId ? ` · Master: ${c.masterComplaintId}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.departmentName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${
                        c.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        c.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        c.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${
                        c.status === 'SUBMITTED' ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' :
                        c.status === 'ASSIGNED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                        c.status === 'RESOLVED' ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' :
                        'bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400'
                      }`}>
                        {c.status}
                      </span>
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

export default AdminDashboard;
