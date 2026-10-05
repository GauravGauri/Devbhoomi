import React, { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';

const AdminSettings = () => {
  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Network Security</h3>
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Enable Network Restriction</h4>
                <p className="text-xs text-gray-500">Only allow attendance marking from authorized IPs</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Public IP Address</label>
              <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue="127.0.0.1" />
            </div>
            
            <Button>Save Security Settings</Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Attendance Rules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office Start Time</label>
              <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue="09:30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office End Time</label>
              <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue="18:30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (Minutes)</label>
              <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue="15" />
            </div>
          </div>
          <div className="mt-6">
            <Button>Save Rules</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
