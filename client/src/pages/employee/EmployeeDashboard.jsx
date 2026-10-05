import React, { useContext, useEffect, useState } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/attendance/me');
      setAttendance(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/attendance/check-in');
      setAttendance(data.data);
      toast.success('Checked in successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/attendance/check-out');
      setAttendance(data.data);
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-sm z-10">
        <h2 className="text-xl font-semibold text-gray-800">Good Morning, {user?.name || 'Employee'}</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
              <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6">TODAY'S ATTENDANCE</h3>
              
              <div className="text-lg font-medium text-gray-900 mb-2">{currentDate}</div>
              <div className="text-5xl font-light text-gray-900 mb-8 font-mono">
                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </div>
              
              {!attendance ? (
                <Button size="lg" onClick={handleCheckIn} isLoading={loading} className="w-full text-base font-semibold mb-4 rounded-xl py-6 shadow-md hover:shadow-lg transition-all">
                  MARK ATTENDANCE
                </Button>
              ) : !attendance.checkOut ? (
                <Button size="lg" variant="danger" onClick={handleCheckOut} isLoading={loading} className="w-full text-base font-semibold mb-4 rounded-xl py-6 shadow-md hover:shadow-lg transition-all">
                  CHECK OUT
                </Button>
              ) : (
                <div className="w-full bg-gray-100 text-gray-500 font-semibold py-4 rounded-xl text-center mb-4">
                  Attendance Completed
                </div>
              )}
              
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full mt-2">
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Network: Connected
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <span className="text-sm font-medium text-gray-500">Status</span>
                <p className={`mt-2 text-2xl font-bold ${attendance ? 'text-green-600' : 'text-gray-900'}`}>
                  {attendance ? (attendance.checkOut ? 'Completed' : 'Working') : 'Not Checked In'}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <span className="text-sm font-medium text-gray-500">Working Hours</span>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {attendance?.workingHours ? `${Math.floor(attendance.workingHours / 60)}h ${attendance.workingHours % 60}m` : '0h 0m'}
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Today's Timeline</h3>
              
              <div className="flex flex-col space-y-6">
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${attendance?.checkIn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Check-in</h4>
                    <p className="text-sm text-gray-500">{attendance?.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'Not recorded'}</p>
                  </div>
                </div>
                
                <div className="w-0.5 h-8 bg-gray-200 ml-5 -my-4"></div>
                
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${attendance?.checkOut ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Check-out</h4>
                    <p className="text-sm text-gray-500">{attendance?.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'Not recorded'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
