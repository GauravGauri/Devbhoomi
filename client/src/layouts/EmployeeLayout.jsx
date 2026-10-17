import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  LogOut,
  Clock,
  Calendar as CalendarIcon,
  UserCircle,
  FileText as FileTextIcon,
  Wifi,
  WifiOff,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const EmployeeLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Network Gate State
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [wifiInput, setWifiInput] = useState(localStorage.getItem('client_wifi_name') || '');
  const [isVerifyingWifi, setIsVerifyingWifi] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const checkNetwork = async (quiet = false) => {
    if (!quiet) setNetworkLoading(true);
    try {
      const { data } = await api.get('/attendance/network-status');
      setNetworkStatus(data);
    } catch (error) {
      console.error('Failed to query network status:', error);
      // Fallback
      setNetworkStatus({
        authorized: false,
        restrictionEnabled: true,
        message: 'Could not connect to DevBhoomi verification server.',
      });
    } finally {
      if (!quiet) setNetworkLoading(false);
    }
  };

  useEffect(() => {
    checkNetwork();
    // Poll network status every 60 seconds
    const interval = setInterval(() => checkNetwork(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyWifi = async (e) => {
    if (e) e.preventDefault();
    const trimmed = wifiInput.trim();
    if (!trimmed) {
      toast.error('Please enter a Wi-Fi network name');
      return;
    }
    setIsVerifyingWifi(true);
    localStorage.setItem('client_wifi_name', trimmed);

    try {
      const { data } = await api.get('/attendance/network-status');
      setNetworkStatus(data);
      if (data.authorized) {
        toast.success(`Network verified! Connected to ${trimmed}`);
        setShowNetworkModal(false);
      } else {
        toast.error(`Wi-Fi "${trimmed}" is not in the admin's authorized network list.`);
      }
    } catch (err) {
      toast.error('Failed to verify network status');
    } finally {
      setIsVerifyingWifi(false);
    }
  };

  const handleSelectWifiChip = (name) => {
    setWifiInput(name);
    localStorage.setItem('client_wifi_name', name);
    setTimeout(() => {
      checkNetwork(false);
    }, 100);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/employee/dashboard', icon: Clock },
    { name: 'My Attendance', path: '/employee/attendance', icon: CalendarIcon },
    { name: 'Leave Requests', path: '/employee/leaves', icon: FileTextIcon },
    { name: 'My Profile', path: '/employee/profile', icon: UserCircle },
  ];

  // 1. Initial Loading Screen
  if (networkLoading && !networkStatus) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-3 border-blue-600 border-t-transparent mb-3"></div>
          <p className="text-sm font-semibold text-gray-700">Verifying DevBhoomi Office Network...</p>
        </div>
      </div>
    );
  }

  // 2. Network Gate: Strict Lock Screen if restriction is enabled and not authorized
  const isBlocked = networkStatus && networkStatus.restrictionEnabled && !networkStatus.authorized;

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 text-white relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <header className="flex items-center justify-between max-w-4xl mx-auto w-full py-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/30">
              D
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wider leading-tight text-white">DEV BHOOMI</h1>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Employee Portal</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
          </button>
        </header>

        {/* Central Lock Box */}
        <main className="max-w-2xl mx-auto w-full my-auto py-8">
          <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-2xl relative">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-center text-white mb-2">
              Office Wi-Fi Not Connected
            </h2>
            <p className="text-sm text-slate-400 text-center max-w-lg mx-auto mb-8">
              DevBhoomi security policy requires all employee portal pages to run exclusively on the authorized office Wi-Fi network or IP address set by Admin.
            </p>

            {/* Status Breakdown: Dynamically show only the verification methods set by Admin */}
            {(() => {
              const hasConfiguredWifi = Boolean(networkStatus.allowedWifiNames && networkStatus.allowedWifiNames.length > 0);
              const hasConfiguredIP = Boolean(networkStatus.allowedIPs && networkStatus.allowedIPs.length > 0);

              return (
                <div className="space-y-4 mb-6">
                  <div className={`grid ${hasConfiguredWifi && hasConfiguredIP ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                    {/* Option 1: Wi-Fi Name Verification (Only if Admin configured Wi-Fi names) */}
                    {hasConfiguredWifi && (
                      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                              <Wifi className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Wi-Fi Name Verification
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${networkStatus.wifiMatches ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                              {networkStatus.wifiMatches ? 'Matched ✓' : 'Not Matched ✗'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mb-1">
                            Detected Wi-Fi: <span className="font-mono text-white font-semibold">{networkStatus.clientWifiName || 'Not Set'}</span>
                          </p>
                          <div className="mt-2 text-[11px] text-slate-400">
                            <span className="block font-medium mb-1">Allowed Wi-Fi Networks:</span>
                            <div className="flex flex-wrap gap-1">
                              {networkStatus.allowedWifiNames.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => handleSelectWifiChip(name)}
                                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600/30 text-blue-300 font-mono text-[10px] border border-slate-700 transition-colors"
                                  title="Click to select this Wi-Fi name"
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Option 2: IP Address Verification (Only if Admin configured IPs) */}
                    {hasConfiguredIP && (
                      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                              <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Office Wi-Fi IP Verification
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${networkStatus.ipMatches ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                              {networkStatus.ipMatches ? 'Matched ✓' : 'Not Matched ✗'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mb-1">
                            Your Connected IP: <span className="font-mono text-white font-bold">{networkStatus.clientIP || 'Unknown'}</span>
                          </p>
                          <div className="mt-2 text-[11px] text-slate-400">
                            <span className="block font-medium mb-1">Allowed Office IP(s):</span>
                            <div className="flex flex-wrap gap-1">
                              {networkStatus.allowedIPs.map((ip) => (
                                <span key={ip} className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] border border-slate-700 font-semibold">
                                  {ip}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wi-Fi Name Input verification form - ONLY shown if Admin actually configured Wi-Fi names */}
                  {hasConfiguredWifi && (
                    <form onSubmit={handleVerifyWifi} className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 space-y-3">
                      <label className="block text-xs font-semibold text-slate-300">
                        Connected to office Wi-Fi? Enter or confirm your Wi-Fi Network Name:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={wifiInput}
                          onChange={(e) => setWifiInput(e.target.value)}
                          placeholder="e.g. Airtel_shan_6332, DevBhoomi-WiFi"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                        <button
                          type="submit"
                          disabled={isVerifyingWifi}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center shadow-md shadow-blue-600/30"
                        >
                          {isVerifyingWifi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify Wi-Fi'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })()}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => checkNetwork(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check Network Connection</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center sm:text-right">
                {Boolean(networkStatus.allowedWifiNames?.length && networkStatus.allowedIPs?.length)
                  ? 'Matches if Wi-Fi Name OR IP Address matches.'
                  : networkStatus.allowedIPs?.length
                  ? 'Automatic verification by Office Wi-Fi IP.'
                  : 'Automatic verification by Office Wi-Fi Name.'}
              </p>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-500 py-3">
          DevBhoomi Attendance & Security System • All pages network-gated
        </footer>
      </div>
    );
  }

  // 3. Normal Layout when network is authorized
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            D
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-wider leading-tight">DEV BHOOMI</h1>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Employee Portal</span>
          </div>
        </div>

        {/* Network Status Widget in Sidebar */}
        <div className="p-3 mx-3 my-2 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-slate-700">Office Network</span>
            </div>
            <button
              onClick={() => setShowNetworkModal(true)}
              className="text-[10px] font-semibold text-blue-600 hover:underline"
              title="View or change Wi-Fi"
            >
              Configure
            </button>
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-1 font-mono">
            {networkStatus?.clientWifiName ? `Wi-Fi: ${networkStatus.clientWifiName}` : `IP: ${networkStatus?.clientIP || 'Local'}`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg group transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs' : 'text-gray-700 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || 'E'}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Employee'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Network Configuration Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Office Network Status</h3>
              </div>
              <button onClick={() => setShowNetworkModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-xs text-green-800 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                <span>You are currently connected to an authorized office network.</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase">Detected IP Address</span>
                <p className="text-sm font-mono font-bold text-gray-800">{networkStatus?.clientIP || '-'}</p>
              </div>

              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase">Connected Wi-Fi Name</span>
                <input
                  type="text"
                  value={wifiInput}
                  onChange={(e) => setWifiInput(e.target.value)}
                  placeholder="Enter connected Wi-Fi SSID"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {networkStatus?.allowedWifiNames && networkStatus.allowedWifiNames.length > 0 && (
                <div>
                  <span className="block text-[11px] font-semibold text-gray-400 uppercase mb-1">Admin Allowed Wi-Fi Networks:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {networkStatus.allowedWifiNames.map((name) => (
                      <span
                        key={name}
                        onClick={() => setWifiInput(name)}
                        className="cursor-pointer px-2 py-0.5 rounded-md bg-gray-100 hover:bg-blue-50 text-blue-700 border border-gray-200 text-xs font-mono"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleVerifyWifi}
                disabled={isVerifyingWifi}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center"
              >
                {isVerifyingWifi ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Update & Re-check
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLayout;
