import React, { useState } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';

const LeaveRequests = () => {
  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">My Leave Requests</h2>
        <Button className="flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Request Leave
        </Button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex items-center justify-center text-gray-500">
          <div>
            <p className="text-center text-lg mb-2">Leave history will appear here</p>
            <p className="text-sm">You haven't requested any leaves yet.</p>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default LeaveRequests;
