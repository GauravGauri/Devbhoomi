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
  Utensils,
  Coffee,
  Play,
  Pause,
  Timer,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Navigation,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getCurrentLocation } from '../../services/locationService';

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState(null);
  const [networkStatus, setNetworkStatus] = useState({ authorized: true, networkName: 'Connecting...', clientIP: '' });
  const [geoStatus, setGeoStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [geoRefreshing, setGeoRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time timers
  const [elapsedNetMinutes, setElapsedNetMinutes] = useState(0);
  const [activeBreakElapsedSeconds, setActiveBreakElapsedSeconds] = useState(0);

  // Live ticking clock & active break seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (attendance?.isOnBreak && attendance?.currentBreakStart) {
        const breakStart = new Date(attendance.currentBreakStart).getTime();
        const diffSecs = Math.max(0, Math.floor((now.getTime() - breakStart) / 1000));
        setActiveBreakElapsedSeconds(diffSecs);
      } else {
        setActiveBreakElapsedSeconds(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [attendance?.isOnBreak, attendance?.currentBreakStart]);

  const fetchAttendanceAndNetwork = async (quiet = true) => {
    if (!quiet) setGeoRefreshing(true);
    try {
      // 1. Fetch current GPS location
      const coords = await getCurrentLocation(false).catch(() => null);

      // 2. Call verify-location: checks boundary and triggers auto-break if employee is on duty & outside
      let verifyRes = null;
      try {
        verifyRes = await api.post('/attendance/verify-location', {
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
      } catch (err) {
        console.error('Verify location failed:', err);
      }

      if (verifyRes?.data?.geoAuth) {
        setGeoStatus(verifyRes.data.geoAuth);
      }

      if (verifyRes?.data?.autoBreakTriggered) {
        toast.error('You are outside the office boundary! Working hours paused and automatic break started.', {
          duration: 8000,
          icon: '📍',
        });
      }

      // 3. Network status fallback
      const netCheck = await api.get('/attendance/network-status');
      const allowed = netCheck.data?.allowedWifiNames || [];
      const storedWifi = localStorage.getItem('client_wifi_name');
      const isStoredValid = storedWifi && allowed.some((w) => w.toLowerCase() === storedWifi.toLowerCase());

      if (allowed.length > 0 && !isStoredValid) {
        if (allowed.length === 1) {
          localStorage.setItem('client_wifi_name', allowed[0]);
        } else {
          localStorage.removeItem('client_wifi_name');
        }
      }

      const [attRes, netRes] = await Promise.all([
        api.get('/attendance/me'),
        api.get('/attendance/network-status'),
      ]);

      // If verify-location updated attendance record (e.g. auto-break), use it
      setAttendance(verifyRes?.data?.attendance || attRes.data.data);
      if (netRes.data) {
        setNetworkStatus(netRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!quiet) setGeoRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceAndNetwork(false);

    // Re-verify location and auto-break every 30 seconds
    const interval = setInterval(() => {
      fetchAttendanceAndNetwork(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check location & trigger auto-break whenever employee opens portal or switches to tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAttendanceAndNetwork(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Compute live net working time (gross elapsed minus completed breaks minus active break)
  useEffect(() => {
    if (attendance?.checkIn && !attendance?.checkOut) {
      const calcNetElapsed = () => {
        const checkInTime = new Date(attendance.checkIn).getTime();
        const now = new Date().getTime();
        const grossMinutes = Math.max(0, Math.floor((now - checkInTime) / 60000));
        
        // Sum completed break minutes
        const completedBreakMins = attendance.totalBreakMinutes || 0;

        // If currently on break, add active break duration to deduction
        let activeBreakMins = 0;
        if (attendance.isOnBreak && attendance.currentBreakStart) {
          activeBreakMins = Math.max(0, Math.floor((now - new Date(attendance.currentBreakStart).getTime()) / 60000));
        }

        const totalDeduction = completedBreakMins + activeBreakMins;
        const netMinutes = Math.max(0, grossMinutes - totalDeduction);
        setElapsedNetMinutes(netMinutes);
      };

      calcNetElapsed();
      const interval = setInterval(calcNetElapsed, 5000);
      return () => clearInterval(interval);
    } else if (attendance?.workingHours !== undefined) {
      setElapsedNetMinutes(attendance.workingHours);
    }
  }, [attendance]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      // 1. Acquire fresh GPS location
      const coords = await getCurrentLocation(true).catch(() => null);

      if (!coords && geoStatus?.geofenceEnabled && geoStatus?.officeSet) {
        toast.error('Device GPS location is required to mark attendance. Please enable location access in browser.');
        setLoading(false);
        return;
      }

      // 2. Pre-verify boundary
      const verify = await api.post('/attendance/verify-location', {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      if (verify.data?.geoAuth) setGeoStatus(verify.data.geoAuth);

      if (verify.data?.geoAuth?.geofenceEnabled && verify.data?.geoAuth?.officeSet && !verify.data?.geoAuth?.withinGeofence) {
        toast.error(`Outside office boundary (${verify.data.geoAuth.distanceMeters}m away from ${verify.data.geoAuth.officeLocation?.name || 'Office'}). You must be inside ${verify.data.geoAuth.allowedRadiusMeters}m to punch in.`);
        setLoading(false);
        return;
      }

      // Fallback check if geofencing is not configured but network restriction is enabled
      if (!verify.data?.geoAuth?.geofenceEnabled && networkStatus?.restrictionEnabled && !networkStatus?.authorized) {
        toast.error('Office Wi-Fi not connected. Please connect to authorized office Wi-Fi or office network to punch in.');
        setLoading(false);
        return;
      }

      const { data } = await api.post('/attendance/check-in', {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      setAttendance(data.data);
      if (data.geoAuth) setGeoStatus(data.geoAuth);
      toast.success('Punched in successfully! Have a productive day.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setBreakLoading(true);
    try {
      const coords = await getCurrentLocation(true).catch(() => null);

      const { data } = await api.post('/attendance/break/start', {
        breakType: 'Lunch Break',
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      setAttendance(data.data);
      if (data.geoAuth) setGeoStatus(data.geoAuth);
      toast.success('Lunch break started. Work hours are paused and deducted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start break');
    } finally {
      setBreakLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setBreakLoading(true);
    try {
      // 1. Acquire fresh GPS location
      const coords = await getCurrentLocation(true).catch(() => null);

      // 2. Pre-verify boundary: employee must return inside office premise to resume work
      const verify = await api.post('/attendance/verify-location', {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      if (verify.data?.geoAuth) setGeoStatus(verify.data.geoAuth);

      if (verify.data?.geoAuth?.geofenceEnabled && verify.data?.geoAuth?.officeSet && !verify.data?.geoAuth?.withinGeofence) {
        toast.error(`Cannot resume work: You are outside office boundary (${verify.data.geoAuth.distanceMeters}m away). Return inside office premise to resume duty.`);
        setBreakLoading(false);
        return;
      }

      const { data } = await api.post('/attendance/break/end', {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      setAttendance(data.data);
      if (data.geoAuth) setGeoStatus(data.geoAuth);
      toast.success('Break ended. Resumed duty, welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end break');
    } finally {
      setBreakLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (attendance?.isOnBreak) {
      if (!window.confirm('You are currently on break. Checking out now will end and deduct your break. Proceed?')) {
        return;
      }
    }
    setLoading(true);
    try {
      // 1. Acquire fresh GPS location
      const coords = await getCurrentLocation(true).catch(() => null);

      // 2. Pre-verify boundary
      const verify = await api.post('/attendance/verify-location', {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      if (verify.data?.geoAuth) setGeoStatus(verify.data.geoAuth);

      if (verify.data?.geoAuth?.geofenceEnabled && verify.data?.geoAuth?.officeSet && !verify.data?.geoAuth?.withinGeofence) {
        toast.error(`Cannot punch out: Outside office boundary (${verify.data.geoAuth.distanceMeters}m away). You must be physically inside office premise to punch out.`);
        setLoading(false);
        return;
      }

      // Fallback check if geofencing is not configured but network restriction is enabled
      if (!verify.data?.geoAuth?.geofenceEnabled && networkStatus?.restrictionEnabled && !networkStatus?.authorized) {
        toast.error('Office Wi-Fi not connected. Please connect to authorized office Wi-Fi or office network to punch out.');
        setLoading(false);
        return;
      }

      const { data } = await api.post('/attendance/check-out', {
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      setAttendance(data.data);
      if (data.geoAuth) setGeoStatus(data.geoAuth);
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

  const formattedHours = Math.floor(elapsedNetMinutes / 60);
  const formattedMins = elapsedNetMinutes % 60;

  // Format active break clock (HH:MM:SS)
  const breakHrs = Math.floor(activeBreakElapsedSeconds / 3600);
  const breakMins = Math.floor((activeBreakElapsedSeconds % 3600) / 60);
  const breakSecs = activeBreakElapsedSeconds % 60;
  const formattedBreakTimer = `${String(breakHrs).padStart(2, '0')}:${String(breakMins).padStart(2, '0')}:${String(breakSecs).padStart(2, '0')}`;

  // Total break duration including active break
  const totalBreakDeducted = (attendance?.totalBreakMinutes || 0) + (attendance?.isOnBreak ? Math.floor(activeBreakElapsedSeconds / 60) : 0);

  // Active break info
  const activeBreak = attendance?.breaks?.slice()?.reverse()?.find((b) => !b.endTime);
  const isAutoBreak = Boolean(attendance?.isOnBreak && (activeBreak?.isAutomatic || activeBreak?.breakType?.includes('Auto Break')));
  const isOutsideGeofence = Boolean(geoStatus?.geofenceEnabled && geoStatus?.officeSet && !geoStatus?.withinGeofence);

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
        {/* 1. Outside Office Boundary Warning Banner */}
        {isOutsideGeofence && (
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-red-500">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-md">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/30 text-white text-[11px] font-black uppercase tracking-wide">
                    Outside Office Boundary
                  </span>
                  <span className="text-xs text-red-100 font-mono font-bold">
                    {geoStatus.distanceMeters !== null ? `${geoStatus.distanceMeters} meters away` : 'Boundary Exceeded'}
                  </span>
                </div>
                <h3 className="text-lg font-black mt-0.5">
                  You are outside {geoStatus.officeLocation?.name || 'the office premise'}
                </h3>
                <p className="text-xs text-red-100">
                  Allowed boundary radius is {geoStatus.allowedRadiusMeters}m. Check-in, Breakover (Resume), and Check-out are locked until you are physically inside the office.
                  {attendance?.checkIn && !attendance?.checkOut && ' Your active shift is placed on Automatic Break.'}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => fetchAttendanceAndNetwork(false)}
              isLoading={geoRefreshing}
              className="bg-white text-red-700 hover:bg-red-50 font-bold text-xs shadow-md flex-shrink-0 border-0"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-check Location
            </Button>
          </div>
        )}

        {/* 2. Office Wi-Fi Not Connected Warning Banner (Only if Geofencing is not active) */}
        {!geoStatus?.geofenceEnabled && networkStatus?.restrictionEnabled && !networkStatus?.authorized && (
          <div className="bg-red-50 border-2 border-red-400 text-red-950 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse shadow-md shadow-red-600/30">
                <WifiOff className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wide">
                    Network Restricted
                  </span>
                  <span className="text-xs text-red-700 font-mono font-bold">
                    {networkStatus?.clientWifiName ? `Wi-Fi: "${networkStatus.clientWifiName}" not authorized` : 'Office Wi-Fi not connected'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-red-900 mt-0.5">
                  Office Wi-Fi Not Connected
                </h3>
                <p className="text-xs text-red-700">
                  Punch-in, Punch-out, and Lunch Breaks are locked. Please connect to authorized office Wi-Fi or office IP address.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => fetchAttendanceAndNetwork(false)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-check Network
            </Button>
          </div>
        )}

        {/* 3. Break Notification Alert Banner (Auto-Break vs Standard Lunch Break) */}
        {attendance?.isOnBreak && (
          <div className={`rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border ${
            isAutoBreak
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white border-red-400'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-pulse">
                {isAutoBreak ? <MapPin className="w-6 h-6 text-white" /> : <Utensils className="w-6 h-6 text-white" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/30 text-white text-[11px] font-extrabold uppercase tracking-wide">
                    {isAutoBreak ? 'Auto Break (Out of Office)' : 'Lunch Break Active'}
                  </span>
                  <span className="text-xs text-white/90 font-mono">
                    Started at {new Date(attendance.currentBreakStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold mt-0.5">
                  {isAutoBreak ? 'Shift Paused: You left office premises' : 'Working hours are currently paused'}
                </h3>
                <p className="text-xs text-white/90">
                  {isAutoBreak
                    ? `You are ${geoStatus?.distanceMeters !== null ? `${geoStatus.distanceMeters}m away from office` : 'outside office'}. Working hours are paused and deducted until you return to office.`
                    : 'Break time is being counted and automatically deducted from your daily shift hours until you resume.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-center sm:text-right bg-black/10 px-4 py-2 rounded-xl border border-white/10">
                <span className="block text-[10px] font-bold text-amber-100 uppercase tracking-widest">Break Duration</span>
                <span className="text-2xl font-black font-mono tracking-tight">{formattedBreakTimer}</span>
              </div>
              {isOutsideGeofence ? (
                <Button
                  size="md"
                  onClick={() => toast.error(`Cannot resume work: You are outside office boundary (${geoStatus.distanceMeters}m away). Return inside office premise to resume duty.`)}
                  className="bg-white/80 hover:bg-white text-red-700 font-extrabold shadow-md border-0 text-xs py-3"
                >
                  <MapPin className="w-4 h-4 mr-1.5 text-red-600" /> Return to Office to Resume
                </Button>
              ) : (
                <Button
                  size="md"
                  onClick={handleEndBreak}
                  isLoading={breakLoading}
                  className="bg-white text-orange-700 hover:bg-amber-50 font-extrabold shadow-md border-0"
                >
                  <Play className="w-4 h-4 mr-1.5 fill-current" /> End Break & Resume
                </Button>
              )}
            </div>
          </div>
        )}

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

              {/* Action Buttons: Check In, Lunch Break, Check Out */}
              <div className="w-full space-y-3 mb-6">
                {!attendance ? (
                  isOutsideGeofence ? (
                    <Button
                      size="lg"
                      onClick={() => toast.error(`Outside office boundary (${geoStatus.distanceMeters}m away from ${geoStatus.officeLocation?.name || 'Office'}). You must be inside ${geoStatus.allowedRadiusMeters}m to punch in.`)}
                      className="w-full text-xs font-bold rounded-xl py-5 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300 shadow-none transition-all flex items-center justify-center"
                    >
                      <MapPin className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                      <span>OUTSIDE OFFICE BOUNDARY ({geoStatus.distanceMeters}M AWAY - PUNCH LOCKED)</span>
                    </Button>
                  ) : !geoStatus?.geofenceEnabled && networkStatus?.restrictionEnabled && !networkStatus?.authorized ? (
                    <Button
                      size="lg"
                      onClick={() => toast.error('Office Wi-Fi not connected. Please connect to authorized office Wi-Fi or IP to punch in.')}
                      className="w-full text-xs font-bold rounded-xl py-5 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300 shadow-none transition-all flex items-center justify-center"
                    >
                      <WifiOff className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                      <span>OFFICE WI-FI NOT CONNECTED (PUNCH LOCKED)</span>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleCheckIn}
                      isLoading={loading}
                      className="w-full text-base font-bold rounded-xl py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      MARK ATTENDANCE (PUNCH IN)
                    </Button>
                  )
                ) : !attendance.checkOut ? (
                  <div className="space-y-2.5">
                    {/* Break Option Toggle */}
                    {attendance.isOnBreak ? (
                      isOutsideGeofence ? (
                        <Button
                          size="lg"
                          onClick={() => toast.error(`Cannot resume work: You are outside the office boundary (${geoStatus.distanceMeters}m away). Return inside office premise to resume duty.`)}
                          className="w-full text-xs font-bold rounded-xl py-4 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300 shadow-none flex items-center justify-center transition-all"
                        >
                          <MapPin className="w-4 h-4 mr-2 text-red-600" />
                          <span>OUTSIDE OFFICE BOUNDARY (RESUME LOCKED)</span>
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          onClick={handleEndBreak}
                          isLoading={breakLoading}
                          className="w-full text-sm font-bold rounded-xl py-4 bg-amber-600 hover:bg-amber-700 text-white shadow-md flex items-center justify-center transition-all"
                        >
                          <Play className="w-4 h-4 mr-2 fill-current" />
                          END BREAK (RESUME WORK)
                        </Button>
                      )
                    ) : (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleStartBreak}
                        isLoading={breakLoading}
                        className="w-full text-sm font-bold rounded-xl py-4 border-amber-500 text-amber-700 bg-amber-50/50 hover:bg-amber-100/60 shadow-xs flex items-center justify-center transition-all"
                      >
                        <Utensils className="w-4 h-4 mr-2 text-amber-600" />
                        START LUNCH BREAK
                      </Button>
                    )}

                    {/* Punch Out Button */}
                    {isOutsideGeofence ? (
                      <Button
                        size="lg"
                        onClick={() => toast.error(`Cannot punch out: Outside office boundary (${geoStatus.distanceMeters}m away). You must be physically inside office premise to punch out.`)}
                        className="w-full text-xs font-bold rounded-xl py-4 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300 shadow-none transition-all flex items-center justify-center"
                      >
                        <MapPin className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                        <span>OUTSIDE OFFICE BOUNDARY (CHECKOUT LOCKED)</span>
                      </Button>
                    ) : !geoStatus?.geofenceEnabled && networkStatus?.restrictionEnabled && !networkStatus?.authorized ? (
                      <Button
                        size="lg"
                        onClick={() => toast.error('Office Wi-Fi not connected. Please connect to authorized office Wi-Fi or IP to punch out.')}
                        className="w-full text-xs font-bold rounded-xl py-4 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300 shadow-none transition-all flex items-center justify-center"
                      >
                        <WifiOff className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
                        <span>OFFICE WI-FI NOT CONNECTED (CHECKOUT LOCKED)</span>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant="danger"
                        onClick={handleCheckOut}
                        isLoading={loading}
                        className="w-full text-sm font-bold rounded-xl py-4 bg-red-600 hover:bg-red-700 text-white shadow-md transition-all"
                      >
                        PUNCH OUT (FINISH SHIFT)
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-green-50 border border-green-200 text-green-800 font-semibold py-4 rounded-xl text-center text-sm">
                    ✓ Today's Attendance Completed
                  </div>
                )}
              </div>

              {/* Status Badges: Geofence and Network */}
              <div className="flex flex-col items-center gap-2 w-full">
                {geoStatus?.geofenceEnabled && geoStatus?.officeSet && (
                  <div className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border ${
                    geoStatus.withinGeofence
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <MapPin className={`w-3.5 h-3.5 mr-1.5 ${geoStatus.withinGeofence ? 'text-emerald-600' : 'text-red-600'}`} />
                    <span>
                      {geoStatus.withinGeofence
                        ? `Inside Office Premise (${geoStatus.distanceMeters !== null ? `${geoStatus.distanceMeters}m` : 'Verified'})`
                        : `Outside Office: ${geoStatus.distanceMeters}m away (Max: ${geoStatus.allowedRadiusMeters}m)`}
                    </span>
                  </div>
                )}

                {(!geoStatus?.geofenceEnabled || !geoStatus?.officeSet) && (
                  <div className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border">
                    {networkStatus.authorized ? (
                      <span className="flex items-center text-green-700 bg-green-50 border-green-200">
                        <Wifi className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                        Office Wi-Fi: {networkStatus.networkName || networkStatus.clientWifiName || 'Connected'}
                      </span>
                    ) : (
                      <span className="flex items-center text-red-700 bg-red-50 border-red-200 font-bold">
                        <WifiOff className="w-3.5 h-3.5 mr-1.5 text-red-600" />
                        Office Wi-Fi Not Connected
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cards 2 & 3: Shift Status, Net Working Hours, & Break Tracker */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Shift Status */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Status</span>
                <div className="my-2">
                  <p
                    className={`text-xl font-black ${
                      attendance
                        ? attendance.checkOut
                          ? 'text-blue-600'
                          : attendance.isOnBreak
                          ? isAutoBreak ? 'text-rose-600' : 'text-amber-600'
                          : 'text-green-600'
                        : 'text-gray-800'
                    }`}
                  >
                    {attendance
                      ? attendance.checkOut
                        ? 'Shift Completed'
                        : attendance.isOnBreak
                        ? isAutoBreak ? 'Auto Break (Out of Office)' : 'On Lunch Break'
                        : 'On Duty (Working)'
                      : 'Not Checked In'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {attendance?.isOnBreak
                      ? isAutoBreak ? 'Left office premise - Paused' : 'Work time is paused'
                      : attendance?.late
                      ? 'Late arrival recorded'
                      : attendance?.checkIn
                      ? 'Punched on time'
                      : 'Ready to begin shift'}
                  </p>
                </div>
                <div className="flex items-center text-[11px] font-semibold text-gray-500">
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${attendance?.isOnBreak ? 'bg-amber-500 animate-ping' : attendance?.checkIn && !attendance?.checkOut ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  {attendance?.isOnBreak ? 'Break deducting' : attendance?.checkIn && !attendance?.checkOut ? 'Timer active' : 'Offline'}
                </div>
              </div>

              {/* Net Working Hours Counter */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Work Hours</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <p className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                    {formattedHours}h {formattedMins}m
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {attendance?.checkIn && !attendance?.checkOut ? 'Net session (breaks deducted)' : 'Recorded net hours'}
                  </p>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold">Excludes all break time</span>
              </div>

              {/* Total Lunch / Break Time */}
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Break Deducted</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <p className="text-2xl font-black text-amber-600 font-mono tracking-tight">
                    {totalBreakDeducted}m
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {attendance?.isOnBreak ? 'Active break counting' : 'Total deducted from shift'}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold ${attendance?.isOnBreak ? 'text-amber-600 font-bold' : 'text-gray-500'}`}>
                  {attendance?.isOnBreak ? '● Currently on break' : `${(attendance?.breaks?.length || 0)} breaks taken`}
                </span>
              </div>
            </div>

            {/* Today's Shift Activity Timeline with Breaks */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-gray-900">Today's Shift Activity Timeline</h3>
                <span className="text-xs text-gray-500 font-mono">{currentDateFormatted}</span>
              </div>

              <div className="flex flex-col space-y-4">
                {/* 1. Check In */}
                <div className="flex items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      attendance?.checkIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
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
                    {attendance?.checkInLocation?.distanceMeters !== undefined && attendance.checkInLocation.distanceMeters !== null && (
                      <span className="text-[11px] text-emerald-700 font-mono flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 inline" />
                        Punched {attendance.checkInLocation.distanceMeters}m from office
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Break Events in Timeline */}
                {attendance?.breaks && attendance.breaks.length > 0 && (
                  attendance.breaks.map((b, idx) => (
                    <React.Fragment key={idx}>
                      <div className="w-0.5 h-5 bg-amber-200 ml-5"></div>
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          b.isAutomatic || b.breakType?.includes('Auto Break')
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {b.isAutomatic || b.breakType?.includes('Auto Break') ? (
                            <MapPin className="w-5 h-5" />
                          ) : (
                            <Utensils className="w-5 h-5" />
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-gray-900">{b.breakType || 'Break'}</h4>
                              {(b.isAutomatic || b.breakType?.includes('Auto Break')) && (
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-red-100 text-red-800">
                                  Auto Break
                                </span>
                              )}
                            </div>
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">
                              {b.endTime ? `${b.duration} mins deducted` : 'In Progress (Paused)'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {b.endTime ? ` — ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Ongoing)'}
                          </p>
                          {b.remarks && (
                            <p className="text-[11px] text-gray-400 mt-0.5 italic">
                              {b.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  ))
                )}

                <div className="w-0.5 h-5 bg-gray-200 ml-5"></div>

                {/* 3. Check Out */}
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
                        ? 'Shift active. Click Punch Out when day is complete.'
                        : 'Awaiting shift check-in'}
                    </p>
                    {attendance?.checkOutLocation?.distanceMeters !== undefined && attendance.checkOutLocation.distanceMeters !== null && (
                      <span className="text-[11px] text-red-700 font-mono flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 inline" />
                        Punched {attendance.checkOutLocation.distanceMeters}m from office
                      </span>
                    )}
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
