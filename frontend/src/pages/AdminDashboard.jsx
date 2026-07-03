import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Inbox, Clock, CheckCircle, ShieldAlert, Star, TrendingUp, Users, Building2, ShieldCheck
} from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/analytics/dashboard');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching admin analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading system metrics and analytics...</div>;
  }

  // Format chart details
  const getDeptData = () => {
    if (!stats?.departmentWise) return [];
    return Object.keys(stats.departmentWise).map(key => ({
      name: key.replace('Department', '').trim(),
      Complaints: stats.departmentWise[key]
    }));
  };

  const getPriorityData = () => {
    if (!stats?.priorityWise) return [];
    return Object.keys(stats.priorityWise).map(key => ({
      name: key,
      value: stats.priorityWise[key]
    }));
  };

  const deptData = getDeptData();
  const priorityData = getPriorityData();

  // Mock monthly trends
  const monthlyTrends = [
    { month: 'Jan', Filed: 45, Resolved: 32 },
    { month: 'Feb', Filed: 50, Resolved: 44 },
    { month: 'Mar', Filed: 70, Resolved: 60 },
    { month: 'Apr', Filed: 85, Resolved: 72 },
    { month: 'May', Filed: 60, Resolved: 58 },
    { month: 'Jun', Filed: stats?.totalComplaints || 95, Resolved: (stats?.statusWise?.RESOLVED || 0) + (stats?.statusWise?.CLOSED || 0) },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Admin Control Tower</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review system audit metrics, user roles, department setups, and dashboard charts.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/users" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <Users className="h-3.5 w-3.5 text-blue-600" />
            Manage Users
          </Link>
          <Link to="/departments" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <Building2 className="h-3.5 w-3.5 text-purple-600" />
            Departments
          </Link>
          <Link to="/audit-logs" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
            Audit Logs
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <Inbox className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cases</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-3">{stats?.totalComplaints || 0}</h3>
        </div>

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

      {/* Recharts Panels Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Department-wise Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Department Wise Distribution</h3>
          {deptData.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No data available.</div>
          ) : (
            <div className="h-64 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="Complaints" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Priority Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Priority Level Analysis</h3>
          {priorityData.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No data available.</div>
          ) : (
            <div className="h-64 flex-1 flex flex-col sm:flex-row items-center justify-around gap-4">
              <div className="h-full w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {priorityData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3 text-sm">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{item.name}:</span>
                    <strong className="text-slate-800 dark:text-white">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6">Monthly Volume Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Filed" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
