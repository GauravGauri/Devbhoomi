import React, { useContext } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

const Profile = () => {
  const { user } = useContext(AuthContext);

  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">My Profile</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
          <div className="flex items-center space-x-6 mb-8">
            <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-3xl">
              {user?.name?.charAt(0) || 'E'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{user?.name || 'Employee Name'}</h3>
              <p className="text-gray-500">{user?.designation || 'Staff Member'}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active Account
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Employee ID</p>
              <p className="text-base text-gray-900">{user?.employeeId || 'EMP-001'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
              <p className="text-base text-gray-900">{user?.email || 'email@devbhoomi.local'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Username</p>
              <p className="text-base text-gray-900">{user?.username || 'username'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
              <p className="text-base text-gray-900">{user?.department || 'General'}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 flex justify-end">
            <Button variant="outline" className="mr-3">Change Password</Button>
            <Button>Edit Profile</Button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default Profile;
