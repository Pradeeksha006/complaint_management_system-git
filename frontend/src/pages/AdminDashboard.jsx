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
  const [expandedComplaints, setExpandedComplaints] = useState({});

  const toggleComplaintExpand = (complaintId) => {
    setExpandedComplaints((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

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
      const sortedComplaints = [...complaintList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllComplaints(sortedComplaints);
      setRecentComplaints(sortedComplaints.slice(0, 5));
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
      : complaintView === 'pending'
        ? allComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED')
        : complaintView === 'resolved'
          ? allComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED')
          : complaintView === 'ratings'
            ? allComplaints.filter(c => c.feedback && c.feedback.rating)
            : recentComplaints;
  const complaintPanelTitle = complaintView === 'merged'
    ? 'Merged Complaint Reports'
    : complaintView === 'citizens'
      ? 'Citizen Filed Reports'
      : complaintView === 'pending'
        ? 'Pending Complaints Queue'
        : complaintView === 'resolved'
          ? 'Resolved Complaints Queue'
          : complaintView === 'ratings'
            ? 'Citizen Ratings & Feedback'
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

        <button type="button" onClick={() => setComplaintView('pending')} className="rounded-xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">
            {(stats?.statusWise?.ASSIGNED || 0) + (stats?.statusWise?.IN_PROGRESS || 0) + (stats?.statusWise?.ACCEPTED || 0)}
          </h3>
        </button>

        <button type="button" onClick={() => setComplaintView('resolved')} className="rounded-xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:border-green-300 dark:hover:border-green-700 cursor-pointer">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">
            {(stats?.statusWise?.RESOLVED || 0) + (stats?.statusWise?.CLOSED || 0)}
          </h3>
        </button>

        <button type="button" onClick={() => setComplaintView('ratings')} className="rounded-xl border border-slate-200 bg-white p-5 text-left dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 cursor-pointer">
          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
            <Star className="h-5 w-5 fill-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rating</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">{stats?.averageSatisfaction || 0.0} / 5</h3>
        </button>

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
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 space-y-4 rounded-b-xl border-t border-slate-200 dark:border-slate-850">
            {visibleComplaints.map((c) => {
              if (complaintView === 'ratings') {
                if (!c.feedback) return null;
                return (
                  <div key={c.id} className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center flex-wrap gap-2.5">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{c.id}</span>
                          <span className="text-xs text-slate-400">By: {c.citizenName || 'Anonymous'}</span>
                          <span className="text-xs text-slate-450 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded">Email: {c.citizenEmail || 'N/A'}</span>
                        </div>
                        <div>
                          <h4 className="text-md font-bold text-slate-800 dark:text-white leading-tight">{c.title}</h4>
                          <div className="flex items-center gap-1 mt-2.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < c.feedback.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'}`} 
                              />
                            ))}
                            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 ml-1.5">{c.feedback.rating} / 5</span>
                          </div>
                          {c.feedback.comments && (
                            <p className="text-xs text-slate-650 dark:text-slate-300 mt-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 italic">
                              "{c.feedback.comments}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
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
                          ? 'bg-blue-100 text-blue-805 dark:bg-blue-950/30 dark:text-blue-400'
                          : c.status === 'REJECTED'
                          ? 'bg-red-100 text-red-805 dark:bg-red-950/30 dark:text-red-400'
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
                            <span className="text-xs text-slate-400">By: {c.isAnonymous ? 'Anonymous' : c.citizenName}</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              c.priority === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' :
                              c.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-400' :
                              'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {c.priority}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{c.departmentName}</p>
                            {c.description && <p className="text-xs text-slate-650 dark:text-slate-300 mt-1 leading-relaxed">{c.description}</p>}
                            
                            {complaintView === 'citizens' && (
                              <p className="text-[10px] text-slate-400 mt-2">
                                {c.citizenId ? `CUST-${String(c.citizenId).padStart(4, '0')}` : 'Anonymous'} · {c.citizenEmail || 'N/A'}
                              </p>
                            )}
                            {complaintView === 'merged' && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
                                {(c.supportCount || 1)} linked reports{c.masterComplaintId ? ` · Master: ${c.masterComplaintId}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end shrink-0 pt-3 sm:pt-0" onClick={(e) => e.stopPropagation()}>
                          <Link 
                            to={`/track-complaint/${c.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-blue-600 hover:underline dark:text-blue-400 shadow-sm cursor-pointer"
                          >
                            View Details
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
      </div>
    </div>
  );
};

export default AdminDashboard;
