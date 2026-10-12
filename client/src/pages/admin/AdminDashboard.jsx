import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import {
  Users,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/dashboard/stats');
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Auto-refresh every 45 seconds for real-time monitoring
    const interval = setInterval(fetchDashboardStats, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Admin Control Center</h2>
          <p className="text-xs text-gray-500">Live operational overview & real-time attendance analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardStats}
            isLoading={loading}
            className="flex items-center text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Data
          </Button>
          <Link to="/admin/employees">
            <Button size="sm" className="flex items-center text-xs bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Manage Employees
            </Button>
          </Link>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Pending Leaves Alert Banner */}
        {stats?.pendingLeavesCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-900">
                  {stats.pendingLeavesCount} Pending Leave {stats.pendingLeavesCount === 1 ? 'Request' : 'Requests'} Require Review
                </h4>
                <p className="text-xs text-amber-700">Employees are awaiting administrative moderation.</p>
              </div>
            </div>
            <Link to="/admin/leaves">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex items-center">
                Review Leaves <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* 4 Core KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Active Employees</span>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {loading ? '...' : (stats?.totalEmployees || 0)}
              </p>
              <span className="text-[11px] text-gray-400">Total in system: {stats?.totalAllEmployees || 0}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Present Today</span>
              <p className="text-3xl font-extrabold text-green-600 mt-1">
                {loading ? '...' : (stats?.presentToday || 0)}
              </p>
              <span className="text-[11px] text-amber-600 font-medium">Late: {stats?.lateToday || 0}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Absent Today</span>
              <p className="text-3xl font-extrabold text-red-600 mt-1">
                {loading ? '...' : (stats?.absentToday || 0)}
              </p>
              <span className="text-[11px] text-gray-400">Not checked in</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">On Approved Leave</span>
              <p className="text-3xl font-extrabold text-amber-500 mt-1">
                {loading ? '...' : (stats?.onLeaveToday || 0)}
              </p>
              <span className="text-[11px] text-gray-400">Scheduled today</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts & Department Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Weekly Attendance Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">7-Day Attendance Trend</h3>
                <p className="text-xs text-gray-500">Daily breakdown of employees present versus late punches</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                Last 7 Days
              </span>
            </div>

            <div className="h-64 w-full">
              {stats?.weeklyTrends && stats.weeklyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="present" name="Present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No attendance records found for this period.
                </div>
              )}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">Departments</h3>
                <Link to="/admin/settings" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                  Manage →
                </Link>
              </div>

              <div className="space-y-3">
                {stats?.departmentStats && stats.departmentStats.length > 0 ? (
                  stats.departmentStats.map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center space-x-2.5">
                        <Building className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-gray-800">{dept.name}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {dept.count} {dept.count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No department metrics yet.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link to="/admin/attendance" className="block text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View Full Attendance Ledger →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Attendance Activity Feed */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent Attendance Activity</h3>
              <p className="text-xs text-gray-500">Live timestamped log of latest employee punches</p>
            </div>
            <Link to="/admin/attendance">
              <Button variant="outline" size="sm" className="text-xs flex items-center">
                All Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!stats?.recentAttendance || stats.recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500 text-sm">
                      No attendance activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  stats.recentAttendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                            {record.employee?.name ? record.employee.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{record.employee?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{record.employee?.employeeId || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                          <span className="text-xs text-amber-600 font-medium">Active (On Duty)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.late ? (
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                            Late ({record.lateMinutes}m)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            On Time
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
