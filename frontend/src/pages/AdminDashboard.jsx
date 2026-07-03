import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Inbox, Clock, CheckCircle, Star, TrendingUp, Users, Building2, ShieldCheck,
  Loader2, RefreshCw, FileText, ArrowRight, UserCheck, Tag
} from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'complaints'
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchSupportData();
  }, []);

  useEffect(() => {
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [activeTab]);

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

  const fetchSupportData = async () => {
    try {
      const [deptRes, offRes] = await Promise.all([
        api.get('/api/departments'),
        api.get('/api/users/officers')
      ]);
      setDepartments(deptRes.data);
      setOfficers(offRes.data);
    } catch (err) {
      console.error('Error fetching support data', err);
    }
  };

  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const response = await api.get('/api/complaints?size=100');
      setComplaints(response.data.content || []);
    } catch (err) {
      console.error('Error fetching complaints list', err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const handleDeptTransfer = async (complaintId, targetDeptId) => {
    if (!targetDeptId) return;
    try {
      setUpdatingId(complaintId);
      await api.put(`/api/complaints/${complaintId}/transfer?targetDeptId=${targetDeptId}&remarks=Reassigned by Super Admin`);
      await fetchComplaints();
      await fetchStats();
      alert('Department re-assigned successfully!');
    } catch (err) {
      alert('Failed to transfer department: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOfficerAssign = async (complaintId, officerId) => {
    try {
      setUpdatingId(complaintId);
      if (!officerId) {
        // Option to unassign if needed or skip
        return;
      }
      await api.put(`/api/complaints/${complaintId}/assign?officerId=${officerId}`);
      await fetchComplaints();
      alert('Officer assigned successfully!');
    } catch (err) {
      alert('Failed to assign officer: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading system metrics and analytics...</div>;
  }

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
          <p className="text-sm text-slate-500 dark:text-slate-400">Review system audit metrics, re-route complaints to departments, and assign officers.</p>
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

      {/* Tab Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            System Overview & Charts
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`pb-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'complaints'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Complaints Assignment Center
          </button>
        </nav>
      </div>

      {/* Tab 1: Charts & Analytics */}
      {activeTab === 'analytics' && (
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
      )}

      {/* Tab 2: Complaint Assign/Router Panel */}
      {activeTab === 'complaints' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white">Active Case Assignments</h3>
            <button 
              onClick={fetchComplaints}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg"
              title="Refresh List"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {complaintsLoading ? (
            <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading complaints database...
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No complaints filed in the system.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Title & Citizen</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Route Department</th>
                    <th className="px-4 py-3">Assign Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {complaints.map((c) => {
                    const deptOfficers = officers.filter(o => o.departmentId === c.departmentId);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          <Link to={`/track-complaint/${c.id}`} className="hover:underline">
                            {c.id}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800 dark:text-white max-w-xs truncate" title={c.title}>
                            {c.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            By: {c.isAnonymous ? 'Anonymous' : c.citizenName}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${
                            c.status === 'SUBMITTED' ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' :
                            c.status === 'ASSIGNED' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                            c.status === 'RESOLVED' ? 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400' :
                            'bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <select
                              disabled={updatingId === c.id}
                              value={c.departmentId || ''}
                              onChange={(e) => handleDeptTransfer(c.id, Number(e.target.value))}
                              className="rounded border border-slate-200 bg-transparent py-1 px-2 text-xs outline-none dark:border-slate-800 dark:text-white max-w-[150px]"
                            >
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                            <select
                              disabled={updatingId === c.id}
                              value={c.assignedOfficerId || ''}
                              onChange={(e) => handleOfficerAssign(c.id, Number(e.target.value))}
                              className="rounded border border-slate-200 bg-transparent py-1 px-2 text-xs outline-none dark:border-slate-800 dark:text-white max-w-[160px]"
                            >
                              <option value="">-- Choose Officer --</option>
                              {deptOfficers.map((o) => (
                                <option key={o.id} value={o.id}>{o.fullName} ({o.designation})</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
