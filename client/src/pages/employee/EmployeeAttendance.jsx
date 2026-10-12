import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { Button } from '../../components/ui/Button';
import { Download, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [summary, setSummary] = useState({ totalPresent: 0, totalLate: 0, totalHours: '0.0' });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/my-history?month=${selectedMonth}`);
      setAttendances(data.data || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (error) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth]);

  const handleExportCSV = () => {
    if (attendances.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Late Minutes', 'Remarks'];
    const rows = attendances.map(a => [
      a.date,
      a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '-',
      a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '-',
      a.workingHours ? `${Math.floor(a.workingHours / 60)}h ${a.workingHours % 60}m` : '0h 0m',
      a.late ? 'Late' : a.attendanceType,
      a.lateMinutes || 0,
      `"${(a.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `My_Attendance_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance CSV downloaded successfully');
  };

  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">My Attendance History</h2>
          <p className="text-xs text-gray-500">View and track all your logged punches and work sessions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchHistory} className="flex items-center">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button size="sm" onClick={handleExportCSV} className="flex items-center">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mr-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Present</span>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary.totalPresent}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mr-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Late Check-ins</span>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{summary.totalLate}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Work Hours</span>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">{summary.totalHours} hrs</p>
            </div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50/50 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-gray-500" /> Select Month:
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Showing {attendances.length} records for {selectedMonth}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Working Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-2 align-middle"></div>
                      Loading your attendance...
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      No attendance records found for {selectedMonth}.
                    </td>
                  </tr>
                ) : (
                  attendances.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                      <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                        {record.remarks || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeAttendance;
