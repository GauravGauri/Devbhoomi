import React, { useContext, useEffect, useState } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState(null);
  const [networkStatus, setNetworkStatus] = useState({ authorized: true, networkName: 'Connecting...', ip: '' });
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceAndNetwork = async () => {
    try {
      const [attRes, netRes] = await Promise.all([
        api.get('/attendance/me'),
        api.get('/attendance/network-status'),
      ]);
      setAttendance(attRes.data.data);
      if (netRes.data) {
        setNetworkStatus(netRes.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAttendanceAndNetwork();
  }, []);

  // Compute live elapsed working time if checked in but not checked out
  useEffect(() => {
    if (attendance?.checkIn && !attendance?.checkOut) {
      const calcElapsed = () => {
        const checkInTime = new Date(attendance.checkIn).getTime();
        const now = new Date().getTime();
        const diffMs = Math.max(0, now - checkInTime);
        setElapsedMinutes(Math.floor(diffMs / 60000));
      };
      calcElapsed();
      const interval = setInterval(calcElapsed, 10000);
      return () => clearInterval(interval);
    } else if (attendance?.workingHours) {
      setElapsedMinutes(attendance.workingHours);
    }
  }, [attendance]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/attendance/check-in');
      setAttendance(data.data);
      toast.success('Punched in successfully! Have a productive day.');
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
      toast.success('Punched out successfully! Work session saved.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const currentDateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedHours = Math.floor(elapsedMinutes / 60);
  const formattedMins = elapsedMinutes % 60;

  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs z-10">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Employee'}
          </h2>
          <p className="text-xs text-gray-500">
            {user?.designation || 'Staff Member'} • Employee ID: {user?.employeeId}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/employee/leaves">
            <Button size="sm" variant="outline" className="text-xs flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1" /> Request Leave
            </Button>
          </Link>
          <Link to="/employee/attendance">
            <Button size="sm" className="text-xs flex items-center bg-blue-600 hover:bg-blue-700 text-white">
              <Calendar className="w-3.5 h-3.5 mr-1" /> My Attendance Log
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Live Punch Station */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 flex flex-col items-center relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

              <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-4">
                OFFICIAL TIME STATION
              </span>

              <div className="text-sm font-semibold text-gray-600 mb-2">{currentDateFormatted}</div>

              {/* Live Ticking Clock */}
              <div className="text-4xl font-extrabold text-gray-900 mb-6 font-mono tracking-tight">
                {currentTime.toLocaleTimeString('en-US', { hour12: true })}
              </div>

              {/* Punch In / Punch Out Button */}
              <div className="w-full mb-6">
                {!attendance ? (
                  <Button
                    size="lg"
                    onClick={handleCheckIn}
                    isLoading={loading}
                    className="w-full text-base font-bold rounded-xl py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    MARK ATTENDANCE (PUNCH IN)
                  </Button>
                ) : !attendance.checkOut ? (
                  <Button
                    size="lg"
                    variant="danger"
                    onClick={handleCheckOut}
                    isLoading={loading}
                    className="w-full text-base font-bold rounded-xl py-6 bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    PUNCH OUT
                  </Button>
                ) : (
                  <div className="w-full bg-green-50 border border-green-200 text-green-800 font-semibold py-4 rounded-xl text-center text-sm">
                    ✓ Today's Attendance Completed
                  </div>
                )}
              </div>

              {/* Network Status Badge */}
              <div className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border">
                {networkStatus.authorized ? (
                  <span className="flex items-center text-green-700 bg-green-50 border-green-200">
                    <Wifi className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                    Network: {networkStatus.networkName} (Authorized)
                  </span>
                ) : (
                  <span className="flex items-center text-red-700 bg-red-50 border-red-200">
                    <WifiOff className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                    Network: {networkStatus.networkName} (Restricted)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cards 2 & 3: Shift Status & Real-time Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Shift Status */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Status</span>
                  <p
                    className={`mt-1 text-2xl font-extrabold ${
                      attendance ? (attendance.checkOut ? 'text-blue-600' : 'text-green-600') : 'text-gray-800'
                    }`}
                  >
                    {attendance ? (attendance.checkOut ? 'Completed Day' : 'On Duty (Working)') : 'Not Checked In'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {attendance?.late ? 'Late arrival recorded' : attendance?.checkIn ? 'Punched on time' : 'Ready to begin shift'}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    attendance?.checkIn ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              {/* Working Hours Counter */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Working Session</span>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900 font-mono">
                    {formattedHours}h {formattedMins}m
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {attendance?.checkIn && !attendance?.checkOut ? 'Live session timer active' : 'Total duration recorded'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
              <h3 className="text-base font-bold text-gray-900 mb-6">Today's Shift Activity Timeline</h3>

              <div className="flex flex-col space-y-4">
                <div className="flex items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      attendance?.checkIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">Check In Punch</h4>
                      {attendance?.late && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">
                          Late by {attendance.lateMinutes} mins
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">
                      {attendance?.checkIn
                        ? new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'No punch recorded yet today'}
                    </p>
                  </div>
                </div>

                <div className="w-0.5 h-6 bg-gray-200 ml-5"></div>

                <div className="flex items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      attendance?.checkOut ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-bold text-gray-900">Check Out Punch</h4>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">
                      {attendance?.checkOut
                        ? new Date(attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : attendance?.checkIn
                        ? 'Shift currently active. Click Punch Out when finished.'
                        : 'Awaiting shift check-in'}
                    </p>
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
