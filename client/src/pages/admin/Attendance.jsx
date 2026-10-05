import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Search, Download, Filter, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAttendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        const { data } = await api.get('/attendance/all');
        setAttendances(data.data);
      } catch (error) {
        toast.error('Failed to fetch attendance records');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendances();
  }, []);

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Attendance Log</h2>
        <Button className="flex items-center">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <div className="flex space-x-4">
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Search by name..."
                />
              </div>
            </div>
            <div>
              <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700" />
            </div>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
              ) : attendances.map((record) => (
                <tr key={record._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.employee?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.late ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Late</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">On Time</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;
