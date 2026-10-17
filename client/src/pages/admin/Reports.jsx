import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import {
  Download,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  X,
  FileText,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminReports = () => {
  // Monthly Attendance
  const [attMonth, setAttMonth] = useState(new Date().toISOString().slice(0, 7));
  const [attLoading, setAttLoading] = useState(false);

  // Leaves
  const [leaveYear, setLeaveYear] = useState(new Date().getFullYear().toString());
  const [leaveStatus, setLeaveStatus] = useState('All');
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Late Arrivals
  const [lateDays, setLateDays] = useState('30');
  const [lateLoading, setLateLoading] = useState(false);

  // Preview Modal
  const [previewData, setPreviewData] = useState({
    title: '',
    headers: [],
    rows: [],
    open: false,
    filename: '',
  });

  const downloadCSV = (headers, rows, filename) => {
    if (rows.length === 0) {
      toast.error('No records found for this report criteria.');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename} (${rows.length} rows)`);
  };

  // 1. Export Monthly Attendance
  const handleExportAttendance = async (preview = false) => {
    setAttLoading(true);
    try {
      const { data } = await api.get(`/admin/reports/attendance?month=${attMonth}`);
      const records = data.data || [];

      const headers = ['Employee Name', 'Employee ID', 'Department', 'Date', 'Check In', 'Check Out', 'Break Deducted', 'Net Working Hours', 'Status', 'Remarks'];
      const rows = records.map((r) => [
        r.employeeName,
        r.employeeId,
        r.department,
        r.date,
        r.checkIn,
        r.checkOut,
        r.breakDuration || '0m',
        r.workingHours,
        r.status,
        r.remarks,
      ]);

      if (preview) {
        setPreviewData({
          title: `Monthly Attendance Report (${attMonth})`,
          headers,
          rows,
          open: true,
          filename: `DevBhoomi_Attendance_${attMonth}.csv`,
        });
      } else {
        downloadCSV(headers, rows, `DevBhoomi_Attendance_${attMonth}.csv`);
      }
    } catch (err) {
      toast.error('Failed to generate attendance report');
    } finally {
      setAttLoading(false);
    }
  };

  // 2. Export Leave Summary
  const handleExportLeaves = async (preview = false) => {
    setLeaveLoading(true);
    try {
      const { data } = await api.get(`/admin/reports/leaves?year=${leaveYear}&status=${leaveStatus}`);
      const records = data.data || [];

      const headers = ['Employee Name', 'Employee ID', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Applied At'];
      const rows = records.map((r) => [
        r.employeeName,
        r.employeeId,
        r.department,
        r.leaveType,
        r.startDate,
        r.endDate,
        r.durationDays,
        r.status,
        r.reason,
        r.appliedAt,
      ]);

      if (preview) {
        setPreviewData({
          title: `Leave Summary Report (${leaveYear} - ${leaveStatus})`,
          headers,
          rows,
          open: true,
          filename: `DevBhoomi_Leaves_${leaveYear}_${leaveStatus}.csv`,
        });
      } else {
        downloadCSV(headers, rows, `DevBhoomi_Leaves_${leaveYear}_${leaveStatus}.csv`);
      }
    } catch (err) {
      toast.error('Failed to generate leave report');
    } finally {
      setLeaveLoading(false);
    }
  };

  // 3. Export Late Arrivals
  const handleExportLate = async (preview = false) => {
    setLateLoading(true);
    try {
      const { data } = await api.get(`/admin/reports/late?days=${lateDays}`);
      const records = data.data || [];

      const headers = ['Employee Name', 'Employee ID', 'Department', 'Date', 'Check In', 'Late Minutes', 'Remarks'];
      const rows = records.map((r) => [
        r.employeeName,
        r.employeeId,
        r.department,
        r.date,
        r.checkIn,
        r.lateMinutes,
        r.remarks,
      ]);

      if (preview) {
        setPreviewData({
          title: `Late Arrivals Report (Last ${lateDays} Days)`,
          headers,
          rows,
          open: true,
          filename: `DevBhoomi_Late_Arrivals_Last_${lateDays}d.csv`,
        });
      } else {
        downloadCSV(headers, rows, `DevBhoomi_Late_Arrivals_Last_${lateDays}d.csv`);
      }
    } catch (err) {
      toast.error('Failed to generate late arrivals report');
    } finally {
      setLateLoading(false);
    }
  };

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics Export</h2>
          <p className="text-xs text-gray-500">Generate, preview, and download structured CSV reports from live data</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Monthly Attendance */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Monthly Attendance Ledger</h3>
              <p className="text-xs text-gray-500 mb-4">
                Export complete biometric punches, in/out timestamps, hours worked, and late flags for all employees.
              </p>

              <div className="mb-6 space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Target Month</label>
                <input
                  type="month"
                  value={attMonth}
                  onChange={(e) => setAttMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportAttendance(true)}
                isLoading={attLoading}
                className="w-full text-xs flex items-center justify-center"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Data
              </Button>
              <Button
                size="sm"
                onClick={() => handleExportAttendance(false)}
                isLoading={attLoading}
                className="w-full text-xs flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Card 2: Leave Summary */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Leave Moderation Ledger</h3>
              <p className="text-xs text-gray-500 mb-4">
                Export employee leave applications, approvals, rejections, categories, and audit notes.
              </p>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={leaveYear}
                    onChange={(e) => setLeaveYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={leaveStatus}
                    onChange={(e) => setLeaveStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  >
                    <option value="All">All</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportLeaves(true)}
                isLoading={leaveLoading}
                className="w-full text-xs flex items-center justify-center"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Data
              </Button>
              <Button
                size="sm"
                onClick={() => handleExportLeaves(false)}
                isLoading={leaveLoading}
                className="w-full text-xs flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Card 3: Late Arrivals */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Late Arrival Audit</h3>
              <p className="text-xs text-gray-500 mb-4">
                Identify recurring attendance delays, employee tardiness patterns, and exact late minute infractions.
              </p>

              <div className="mb-6 space-y-1">
                <label className="block text-xs font-semibold text-gray-700">Timeframe</label>
                <select
                  value={lateDays}
                  onChange={(e) => setLateDays(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="60">Last 60 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportLate(true)}
                isLoading={lateLoading}
                className="w-full text-xs flex items-center justify-center"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Data
              </Button>
              <Button
                size="sm"
                onClick={() => handleExportLate(false)}
                isLoading={lateLoading}
                className="w-full text-xs flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewData.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-900">{previewData.title}</h3>
                <p className="text-xs text-gray-500">Live dataset contains {previewData.rows.length} records</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => downloadCSV(previewData.headers, previewData.rows, previewData.filename)}
                  className="text-xs flex items-center bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download CSV
                </Button>
                <button
                  onClick={() => setPreviewData({ ...previewData, open: false })}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {previewData.rows.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  No records match the current criteria to preview.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewData.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2.5 text-left font-semibold text-gray-600 uppercase">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.rows.slice(0, 50).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-gray-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-gray-700 font-mono">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {previewData.rows.length > 50 && (
                <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border-t">
                  Showing first 50 rows of {previewData.rows.length} total rows. Export CSV to download complete dataset.
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setPreviewData({ ...previewData, open: false })}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReports;
