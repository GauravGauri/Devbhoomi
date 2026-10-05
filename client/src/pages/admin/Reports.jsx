import React from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Download } from 'lucide-react';

const AdminReports = () => {
  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Attendance Report</h3>
              <p className="text-sm text-gray-500 mb-4">Export full attendance data for all employees for a specific month.</p>
            </div>
            <Button className="w-full flex items-center justify-center"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Leave Summary Report</h3>
              <p className="text-sm text-gray-500 mb-4">Export approved and rejected leaves for all employees.</p>
            </div>
            <Button className="w-full flex items-center justify-center"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Late Arrival Report</h3>
              <p className="text-sm text-gray-500 mb-4">Export list of employees who arrived late in the last 30 days.</p>
            </div>
            <Button className="w-full flex items-center justify-center"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
