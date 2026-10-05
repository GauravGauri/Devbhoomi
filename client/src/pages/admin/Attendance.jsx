import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Search, Download, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminAttendance = () => {
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
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
            <div>
              <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700" />
            </div>
          </div>
          
          <div className="p-12 text-center text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>Admin Attendance View Component Ready</p>
            <p className="text-sm mt-2">API integration goes here based on requirements</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const CalendarIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);

export default AdminAttendance;
