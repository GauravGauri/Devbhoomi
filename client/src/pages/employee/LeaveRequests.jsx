import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { Button } from '../../components/ui/Button';
import {
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  X,
  Trash2,
  RefreshCw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    reason: '',
  });

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      let query = '/leaves/me?';
      if (statusFilter !== 'All') query += `status=${statusFilter}&`;
      const { data } = await api.get(query);
      setLeaves(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch your leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast.error('Please complete all mandatory fields');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date cannot precede start date');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/leaves', formData);
      toast.success('Leave request submitted successfully for moderation');
      setShowModal(false);
      setFormData({
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        reason: '',
      });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this pending leave request?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      toast.success('Leave request withdrawn successfully');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const isShortOrHalf = formData.leaveType === 'Short Leave' || formData.leaveType === 'Half Day';

  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leave Applications</h2>
          <p className="text-xs text-gray-500">Submit requests for scheduled time off, casual leave, sick days, or short leaves</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchLeaves} className="flex items-center text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setShowModal(true)} size="sm" className="flex items-center text-xs bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Apply for Leave
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* KPI Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">Total Applications</span>
              <p className="text-xl font-bold text-gray-900">{leaves.length}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-600 font-semibold uppercase">Pending Moderation</span>
              <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-green-600 font-semibold uppercase">Approved Requests</span>
              <p className="text-xl font-bold text-green-700">{approvedCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Status Tab Filters */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <span className="text-xs font-semibold text-gray-500">
              Showing {leaves.length} records
            </span>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Leave Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500 text-sm">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mr-2 align-middle"></div>
                      Loading your leave history...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-500 text-sm">
                      No leave requests found for the selected status.
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                          {leave.leaveType}
                        </span>
                        {leave.startTime && leave.endTime && (
                          <div className="text-[11px] text-gray-500 mt-1 font-mono">
                            {leave.startTime} - {leave.endTime}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-mono">
                        {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate">
                        {leave.reason}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          leave.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : leave.status === 'Cancelled'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {leave.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {leave.status === 'Pending' && (
                          <button
                            onClick={() => handleCancelLeave(leave._id)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold hover:underline"
                          >
                            Withdraw Request
                          </button>
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

      {/* MODAL: APPLY FOR LEAVE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Apply for Time-Off / Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Leave Category *</label>
                <select
                  required
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="Casual Leave">Casual Leave (General Time-off)</option>
                  <option value="Sick Leave">Sick Leave (Medical / Illness)</option>
                  <option value="Short Leave">Short Leave (Up to 2 Hours)</option>
                  <option value="Half Day">Half Day (4 Hours Shift)</option>
                  <option value="Earned Leave">Earned Leave (Annual Paid)</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: formData.endDate || e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Time inputs for Short Leave or Half Day */}
              {isShortOrHalf && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-1">From Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-1">To Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Reason *</label>
                <textarea
                  required
                  rows="3"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain reason for leave request clearly for management approval..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
};

export default LeaveRequests;
