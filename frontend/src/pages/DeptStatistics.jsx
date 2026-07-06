import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ClipboardList, CheckCircle2, Clock, AlertTriangle, AlertCircle, 
  Loader2, RefreshCw, BarChart3, PieChart
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Cell, Legend, PieChart as RechartsPieChart, Pie
} from 'recharts';

const DeptStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/api/analytics/department');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch department statistics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Formatting Priority Data for Recharts
  const priorityData = stats ? [
    { name: 'Low', count: stats.lowPriority || 0, color: '#3b82f6' },
    { name: 'Medium', count: stats.mediumPriority || 0, color: '#f59e0b' },
    { name: 'High', count: stats.highPriority || 0, color: '#ef4444' }
  ] : [];

  // Formatting Status Data for Recharts
  const statusData = stats ? [
    { name: 'Pending', value: stats.pendingComplaints || 0, color: '#f59e0b' },
    { name: 'In Progress', value: stats.inProgressComplaints || 0, color: '#3b82f6' },
    { name: 'Resolved', value: stats.resolvedComplaints || 0, color: '#10b981' }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Department Statistics Desk
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time analytics, SLA deadlines, and resolution metrics for your department.
          </p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={refreshing}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          title="Refresh Data"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : <RefreshCw className="h-4 w-4 text-slate-500" />}
        </button>
      </div>

      {/* Critical SLA Warnings */}
      {stats && (stats.overdue > 0 || stats.nearDeadline > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.overdue > 0 && (
            <div className="flex items-start gap-3.5 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30 shadow-sm animate-pulse">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-455 mt-0.5" />
              <div>
                <h4 className="font-bold">Overdue Deadline Warning</h4>
                <p className="text-xs text-red-600/90 dark:text-red-400/90 mt-0.5">
                  There are <strong>{stats.overdue}</strong> active complaints that have crossed their completion deadlines. Please take immediate action to assign or resolve.
                </p>
              </div>
            </div>
          )}
          {stats.nearDeadline > 0 && (
            <div className="flex items-start gap-3.5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 shadow-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-455 mt-0.5" />
              <div>
                <h4 className="font-bold">Approaching Deadlines Alert</h4>
                <p className="text-xs text-amber-600/90 dark:text-amber-455/90 mt-0.5">
                  There are <strong>{stats.nearDeadline}</strong> complaints with deadlines expiring within the next 24 hours. Monitor closely to avoid SLA escalation.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Registered */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.totalComplaints || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        {/* Resolved Complaints */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved so far</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.resolvedComplaints || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.inProgressComplaints || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Action</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.pendingComplaints || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Status Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Severity Counts */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Priority Severity Counts
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeptStatistics;
