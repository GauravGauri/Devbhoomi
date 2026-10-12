import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  AlertCircle,
  X,
  User,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [decisionModal, setDecisionModal] = useState({ open: false, type: 'Approved', remarks: '' });
  const [viewModal, setViewModal] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      let query = '/admin/leaves?';
      if (statusFilter !== 'All') query += `status=${statusFilter}&`;
      const { data } = await api.get(query);
      setLeaves(data.data || []);
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const openDecisionModal = (leave, type) => {
    setSelectedLeave(leave);
    setDecisionModal({
      open: true,
      type,
      remarks: type === 'Approved' ? 'Approved by Admin' : 'Insufficient leave quota or scheduling conflict',
    });
  };

  const submitDecision = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      await api.put(`/admin/leaves/${selectedLeave._id}/status`, {
        status: decisionModal.type,
        remarks: decisionModal.remarks,
      });

      toast.success(`Leave request ${decisionModal.type.toLowerCase()} successfully`);
      setDecisionModal({ open: false, type: 'Approved', remarks: '' });
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to update leave status');
    }
  };

  const openViewModal = (leave) => {
    setSelectedLeave(leave);
    setViewModal(true);
  };

  // Filtered
  const filteredLeaves = leaves.filter((l) => {
    const empName = l.employee?.name?.toLowerCase() || '';
    const empId = l.employee?.employeeId?.toLowerCase() || '';
    const reason = l.reason?.toLowerCase() || '';
    const term = search.toLowerCase();
    return empName.includes(term) || empId.includes(term) || reason.includes(term);
  });

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'Approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'Rejected').length;

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leave Moderation Pipeline</h2>
          <p className="text-xs text-gray-500">Review, evaluate, and moderate employee time-off & leave requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchLeaves} className="flex items-center text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">Total Requests</span>
              <p className="text-xl font-bold text-gray-900">{leaves.length}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
              {leaves.length}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-600 font-semibold uppercase">Pending Moderation</span>
              <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-green-600 font-semibold uppercase">Approved</span>
              <p className="text-xl font-bold text-green-700">{approvedCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-red-600 font-semibold uppercase">Rejected</span>
              <p className="text-xl font-bold text-red-700">{rejectedCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Requests Ledger */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50/50 gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Tabs */}
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      statusFilter === status
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search employee or reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <span className="text-xs font-semibold text-gray-500">
              Showing {filteredLeaves.length} of {leaves.length} requests
            </span>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Leave Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500 text-sm">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mr-2 align-middle"></div>
                      Loading leave requests...
                    </td>
                  </tr>
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500 text-sm">
                      No leave applications found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs mr-3">
                            {leave.employee?.name ? leave.employee.name.charAt(0) : 'E'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{leave.employee?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 font-mono">ID: {leave.employee?.employeeId || '-'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                          {leave.leaveType}
                        </span>
                        {leave.startTime && leave.endTime && (
                          <div className="text-[11px] text-gray-500 mt-1 font-mono">
                            {leave.startTime} - {leave.endTime}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {leave.reason}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          leave.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : leave.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {leave.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openViewModal(leave)}
                          className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {leave.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => openDecisionModal(leave, 'Approved')}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              title="Approve Leave"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDecisionModal(leave, 'Rejected')}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Reject Leave"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
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

      {/* MODAL 1: APPROVE / REJECT CONFIRMATION WITH REMARKS */}
      {decisionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">
                {decisionModal.type === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button onClick={() => setDecisionModal({ ...decisionModal, open: false })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitDecision} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-xs space-y-1">
                <p><span className="font-semibold text-gray-700">Employee:</span> {selectedLeave?.employee?.name}</p>
                <p><span className="font-semibold text-gray-700">Type:</span> {selectedLeave?.leaveType}</p>
                <p><span className="font-semibold text-gray-700">Period:</span> {selectedLeave?.startDate} to {selectedLeave?.endDate}</p>
                <p><span className="font-semibold text-gray-700">Reason:</span> {selectedLeave?.reason}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {decisionModal.type === 'Approved' ? 'Approval Remarks' : 'Rejection Reason *'}
                </label>
                <textarea
                  required={decisionModal.type === 'Rejected'}
                  rows="3"
                  value={decisionModal.remarks}
                  onChange={(e) => setDecisionModal({ ...decisionModal, remarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Add notes for the employee..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setDecisionModal({ ...decisionModal, open: false })}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={decisionModal.type === 'Approved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                >
                  Confirm {decisionModal.type}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL DETAILS VIEW */}
      {viewModal && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Leave Application Details</h3>
              <button onClick={() => setViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  {selectedLeave.employee?.name?.charAt(0) || 'E'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900">{selectedLeave.employee?.name}</h4>
                  <p className="text-xs text-gray-500">ID: {selectedLeave.employee?.employeeId} • {selectedLeave.employee?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Category</span>
                  <p className="font-semibold text-gray-800">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Status</span>
                  <p className="font-semibold text-gray-800">{selectedLeave.status}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Start Date</span>
                  <p className="font-semibold text-gray-800">{selectedLeave.startDate}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase">End Date</span>
                  <p className="font-semibold text-gray-800">{selectedLeave.endDate}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-400 font-semibold uppercase">Full Reason</span>
                <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedLeave.reason}
                </p>
              </div>

              <div className="flex justify-end pt-3">
                <Button onClick={() => setViewModal(false)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLeaves;
