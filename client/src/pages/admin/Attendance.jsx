import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import {
  Search,
  Download,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Manual Punch Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    employeeId: '',
    date: new Date().toISOString().slice(0, 10),
    checkInTime: '09:30',
    checkOutTime: '18:30',
    late: false,
    attendanceType: 'Present',
    remarks: 'Manual entry verified by Admin',
  });

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      let query = '/attendance/all?';
      if (selectedDate) query += `date=${selectedDate}&`;
      if (statusFilter && statusFilter !== 'All') query += `status=${statusFilter}&`;
      if (search) query += `search=${encodeURIComponent(search)}&`;

      const { data } = await api.get(query);
      setAttendances(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const { data } = await api.get('/admin/employees');
      setEmployees(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAttendances();
  };

  const handleExportCSV = () => {
    if (attendances.length === 0) {
      toast.error('No attendance logs to export');
      return;
    }

    const headers = ['Employee Name', 'Employee ID', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Late Minutes', 'Remarks'];
    const rows = attendances.map((r) => [
      `"${(r.employee?.name || 'Unknown').replace(/"/g, '""')}"`,
      r.employee?.employeeId || '-',
      r.date,
      r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '-',
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '-',
      r.workingHours ? `${Math.floor(r.workingHours / 60)}h ${r.workingHours % 60}m` : '0h 0m',
      r.late ? 'Late' : r.attendanceType,
      r.lateMinutes || 0,
      `"${(r.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateLabel = selectedDate || 'All';
    link.setAttribute('download', `DevBhoomi_Attendance_${dateLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance records exported successfully');
  };

  const handleManualPunchSubmit = async (e) => {
    e.preventDefault();
    if (!manualData.employeeId || !manualData.date) {
      toast.error('Please select an employee and date');
      return;
    }

    try {
      const checkInISO = manualData.checkInTime ? `${manualData.date}T${manualData.checkInTime}:00` : null;
      const checkOutISO = manualData.checkOutTime ? `${manualData.date}T${manualData.checkOutTime}:00` : null;

      await api.post('/attendance/manual', {
        employeeId: manualData.employeeId,
        date: manualData.date,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        late: manualData.late,
        attendanceType: manualData.attendanceType,
        remarks: manualData.remarks,
      });

      toast.success('Attendance recorded successfully');
      setShowManualModal(false);
      fetchAttendances();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record manual punch');
    }
  };

  const handleDeleteRecord = async (id, empName) => {
    if (!window.confirm(`Are you sure you want to remove this attendance punch for ${empName || 'this employee'}?`)) {
      return;
    }
    try {
      await api.delete(`/attendance/${id}`);
      toast.success('Attendance record removed');
      fetchAttendances();
    } catch (err) {
      toast.error('Failed to delete attendance record');
    }
  };

  // Metrics
  const totalCount = attendances.length;
  const onTimeCount = attendances.filter((a) => !a.late && a.attendanceType === 'Present').length;
  const lateCount = attendances.filter((a) => a.late).length;

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Attendance Log Ledger</h2>
          <p className="text-xs text-gray-500">Live operational ledger of all employee check-ins, check-outs, and time tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchAttendances} className="flex items-center text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setShowManualModal(true)} size="sm" variant="outline" className="flex items-center text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Record Punch
          </Button>
          <Button onClick={handleExportCSV} size="sm" className="flex items-center text-xs bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Metric Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">Total Punches Listed</span>
              <p className="text-xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {totalCount}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-green-600 font-semibold uppercase">On Time Check-ins</span>
              <p className="text-xl font-bold text-green-700">{onTimeCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-600 font-semibold uppercase">Late Check-ins</span>
              <p className="text-xl font-bold text-amber-700">{lateCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50/50 gap-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Date Filter */}
              <div className="flex items-center space-x-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Clear Date"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 bg-indigo-50 rounded-md"
                >
                  Today
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="On Time">On Time</option>
                <option value="Late">Late</option>
                <option value="Present">Present</option>
                <option value="Half Day">Half Day</option>
              </select>

              <Button type="submit" size="sm" variant="secondary" className="text-xs">
                Filter
              </Button>
            </form>

            <span className="text-xs font-semibold text-gray-500">
              Showing {attendances.length} records
            </span>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Working Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500 text-sm">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mr-2 align-middle"></div>
                      Loading attendance ledger...
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500 text-sm">
                      No attendance logs match the active criteria.
                    </td>
                  </tr>
                ) : (
                  attendances.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                            {record.employee?.name ? record.employee.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{record.employee?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 font-mono">ID: {record.employee?.employeeId || '-'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {record.date}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {record.workingHours ? `${Math.floor(record.workingHours / 60)}h ${record.workingHours % 60}m` : '-'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.late ? (
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Late ({record.lateMinutes}m)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {record.attendanceType || 'On Time'}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteRecord(record._id, record.employee?.name)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: MANUAL PUNCH ENTRY */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Record Attendance Punch</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleManualPunchSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Employee *</label>
                <select
                  required
                  value={manualData.employeeId}
                  onChange={(e) => setManualData({ ...manualData, employeeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={manualData.date}
                  onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={manualData.checkInTime}
                    onChange={(e) => setManualData({ ...manualData, checkInTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={manualData.checkOutTime}
                    onChange={(e) => setManualData({ ...manualData, checkOutTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Attendance Type</label>
                  <select
                    value={manualData.attendanceType}
                    onChange={(e) => setManualData({ ...manualData, attendanceType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Short Leave">Short Leave</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualData.late}
                      onChange={(e) => setManualData({ ...manualData, late: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700">Marked as Late Punch</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Remarks</label>
                <input
                  value={manualData.remarks}
                  onChange={(e) => setManualData({ ...manualData, remarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Field visit, biometric machine outage"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowManualModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Attendance Punch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAttendance;
