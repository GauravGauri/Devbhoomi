import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    leaveType: 'Casual', startDate: '', endDate: '', reason: ''
  });

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leaves/me');
      setLeaves(data.data);
    } catch (error) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', formData);
      toast.success('Leave requested successfully');
      setShowModal(false);
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request leave');
    }
  };

  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">My Leave Requests</h2>
        <Button onClick={() => setShowModal(true)} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Request Leave
        </Button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No leaves found.</td></tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.leaveType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.startDate} - {leave.endDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{leave.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Request Leave</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                  <select required value={formData.leaveType} onChange={(e) => setFormData({...formData, leaveType: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>Casual</option>
                    <option>Sick</option>
                    <option>Short Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input required type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input required type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea required value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} rows="3" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
};

export default LeaveRequests;
