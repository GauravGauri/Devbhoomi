import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Settings } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Total Employees</span>
            <span className="text-3xl font-bold text-gray-900">12</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Present Today</span>
            <span className="text-3xl font-bold text-green-600">9</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Absent Today</span>
            <span className="text-3xl font-bold text-red-600">1</span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">On Leave</span>
            <span className="text-3xl font-bold text-amber-500">2</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to DevBhoomi Admin</h3>
          <p className="text-gray-500 max-w-md">
            Manage your employees, attendance, and leave requests from the sidebar.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
