import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import {
  Shield,
  Clock,
  Building,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Save,
  Wifi,
  Lock,
  Info,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'security' | 'departments' | 'holidays'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [settings, setSettings] = useState({
    networkRestrictionEnabled: false,
    allowedWifiNames: ['DevBhoomi-WiFi'],
    allowedIPs: ['127.0.0.1'],
    officeStartTime: '09:30',
    officeEndTime: '18:30',
    gracePeriod: 15,
    minimumWorkingHours: 480,
    autoCheckoutEnabled: true,
  });

  const [newWifiInput, setNewWifiInput] = useState('');
  const [newIPInput, setNewIPInput] = useState('');
  const [currentNetInfo, setCurrentNetInfo] = useState(null);

  // Departments
  const [departments, setDepartments] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [deptLoading, setDeptLoading] = useState(false);

  // Holidays
  const [holidays, setHolidays] = useState([]);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'Company', description: '' });
  const [holidayLoading, setHolidayLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      if (data.data) {
        setSettings(data.data);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const { data } = await api.get('/admin/holidays');
      setHolidays(data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCurrentNetwork = async () => {
    try {
      const { data } = await api.get('/attendance/network-status');
      setCurrentNetInfo(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchDepartments();
    fetchHolidays();
    fetchCurrentNetwork();
  }, []);

  const handleSettingChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('System settings saved successfully');
      fetchCurrentNetwork();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Wi-Fi Add & Remove
  const handleAddWifi = (e) => {
    if (e) e.preventDefault();
    if (!newWifiInput.trim()) return;
    const wifi = newWifiInput.trim();
    const currentList = settings.allowedWifiNames || [];
    if (currentList.some(w => w.toLowerCase() === wifi.toLowerCase())) {
      toast.error('Wi-Fi Network Name is already in allowlist');
      return;
    }
    setSettings({
      ...settings,
      allowedWifiNames: [...currentList, wifi],
    });
    setNewWifiInput('');
    toast.success(`Added Wi-Fi "${wifi}" to allowlist`);
  };

  const handleRemoveWifi = (wifiToRemove) => {
    setSettings({
      ...settings,
      allowedWifiNames: (settings.allowedWifiNames || []).filter((w) => w !== wifiToRemove),
    });
  };

  // IP Add & Remove
  const handleAddIP = (e) => {
    e.preventDefault();
    if (!newIPInput.trim()) return;
    const ip = newIPInput.trim();
    if (settings.allowedIPs.includes(ip)) {
      toast.error('IP address is already in allowlist');
      return;
    }
    setSettings({
      ...settings,
      allowedIPs: [...settings.allowedIPs, ip],
    });
    setNewIPInput('');
    toast.success(`Added IP "${ip}" to allowlist`);

    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      toast('Note: ' + ip + ' is a local private IP. Cloud apps on Vercel/Render check the Office Wi-Fi Public IP (' + (currentNetInfo?.clientIP || 'shown above') + '). Be sure your public IP is also added!', {
        icon: 'ℹ️',
        duration: 7000,
      });
    }
  };

  const handleRemoveIP = (ipToRemove) => {
    setSettings({
      ...settings,
      allowedIPs: settings.allowedIPs.filter((ip) => ip !== ipToRemove),
    });
  };

  const handleQuickAddCurrentIP = () => {
    if (!currentNetInfo?.clientIP) return;
    const ip = currentNetInfo.clientIP;
    if (settings.allowedIPs.includes(ip)) {
      toast('Your current IP is already in allowlist', { icon: 'ℹ️' });
      return;
    }
    setSettings({
      ...settings,
      allowedIPs: [...settings.allowedIPs, ip],
    });
    toast.success(`Added current IP "${ip}" to allowlist`);
  };

  const handleQuickAddCurrentWifi = () => {
    const wifi = localStorage.getItem('client_wifi_name') || currentNetInfo?.clientWifiName;
    if (!wifi) {
      toast.error('No current Wi-Fi name detected. Please type in Option 1.');
      return;
    }
    const currentList = settings.allowedWifiNames || [];
    if (currentList.some(w => w.toLowerCase() === wifi.toLowerCase())) {
      toast('Current Wi-Fi is already in allowlist', { icon: 'ℹ️' });
      return;
    }
    setSettings({
      ...settings,
      allowedWifiNames: [...currentList, wifi],
    });
    toast.success(`Added current Wi-Fi "${wifi}" to allowlist`);
  };

  // Departments CRUD
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    setDeptLoading(true);
    try {
      await api.post('/admin/departments', deptForm);
      toast.success(`Department "${deptForm.name}" created`);
      setDeptForm({ name: '', description: '' });
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add department');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"? Employees in this department will be unassigned.`)) {
      return;
    }
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success(`Department "${name}" deleted`);
      fetchDepartments();
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  // Holidays CRUD
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.date) return;
    setHolidayLoading(true);
    try {
      await api.post('/admin/holidays', holidayForm);
      toast.success(`Holiday "${holidayForm.name}" added`);
      setHolidayForm({ name: '', date: '', type: 'Company', description: '' });
      fetchHolidays();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add holiday');
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHoliday = async (id, name) => {
    if (!window.confirm(`Delete holiday "${name}"?`)) return;
    try {
      await api.delete(`/admin/holidays/${id}`);
      toast.success(`Holiday "${name}" deleted`);
      fetchHolidays();
    } catch (error) {
      toast.error('Failed to delete holiday');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mr-3"></div>
          Loading system configuration...
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'attendance', name: 'Attendance Rules', icon: Clock },
    { id: 'security', name: 'Network Security', icon: Shield },
    { id: 'departments', name: 'Departments', icon: Building, badge: departments.length },
    { id: 'holidays', name: 'Company Holidays', icon: Calendar, badge: holidays.length },
  ];

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">System Configuration</h2>
          <p className="text-xs text-gray-500">Global shift hours, network IP allowlists, departments, and holiday calendar</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-semibold flex items-center border-b-2 transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
                {tab.badge !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ATTENDANCE RULES */}
        {activeTab === 'attendance' && (
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 space-y-6 max-w-3xl">
            <div>
              <h3 className="text-base font-bold text-gray-900">Attendance Policies & Shift Hours</h3>
              <p className="text-xs text-gray-500">Configure standard working hours and grace period thresholds for late check-in detection</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Official Shift Start Time *</label>
                <input
                  type="time"
                  name="officeStartTime"
                  value={settings.officeStartTime}
                  onChange={handleSettingChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">Punches after this plus grace period are flagged as Late.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Official Shift End Time *</label>
                <input
                  type="time"
                  name="officeEndTime"
                  value={settings.officeEndTime}
                  onChange={handleSettingChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">Standard office checkout timing.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Grace Period (Minutes) *</label>
                <input
                  type="number"
                  name="gracePeriod"
                  min="0"
                  max="120"
                  value={settings.gracePeriod}
                  onChange={handleSettingChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">Allowable delay without marking the employee late.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Minimum Daily Work Minutes</label>
                <input
                  type="number"
                  name="minimumWorkingHours"
                  value={settings.minimumWorkingHours}
                  onChange={handleSettingChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">480 minutes = 8 full hours standard shift.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Auto-checkout on day close</h4>
                <p className="text-xs text-gray-500">Automatically close forgotten employee checkout sessions at midnight</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="autoCheckoutEnabled"
                  checked={settings.autoCheckoutEnabled}
                  onChange={handleSettingChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button type="submit" isLoading={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
                <Save className="w-4 h-4 mr-1.5" /> Save Attendance Rules
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: NETWORK SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 space-y-6 max-w-3xl">
            <div>
              <h3 className="text-base font-bold text-gray-900">Dual-Factor Office Network Gate (Wi-Fi & IP Security)</h3>
              <p className="text-xs text-gray-500">
                Configure specific authorized Wi-Fi network names and IP addresses. When enabled, all employee portal pages will run <strong>ONLY</strong> if the employee's connected Wi-Fi Name matches <strong>OR</strong> their IP address matches.
              </p>
            </div>

            {/* Master Enforce Restriction Toggle */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div>
                <h4 className="text-sm font-bold text-indigo-900">Enforce Office Network Restriction</h4>
                <p className="text-xs text-indigo-700">Strictly locks all employee portal pages unless connected to authorized Wi-Fi or IP</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="networkRestrictionEnabled"
                  checked={settings.networkRestrictionEnabled}
                  onChange={handleSettingChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Live Detection Helper Card for Admin */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-indigo-900 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Detected Office Wi-Fi Public IP:
                </span>
                <span className="text-gray-600 mt-0.5 block font-mono">
                  IP: <strong className="text-indigo-900 text-sm">{currentNetInfo?.clientIP || 'Detecting...'}</strong>
                  {currentNetInfo?.clientWifiName ? ` • Wi-Fi: ${currentNetInfo.clientWifiName}` : ''}
                </span>
                <p className="text-[11px] text-indigo-700/80 mt-1">
                  This is the public internet IP of your office Wi-Fi router. Every device (laptop, phone, PC) connected to this office Wi-Fi shares this IP and will be verified automatically.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleQuickAddCurrentIP}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center"
                >
                  + Add Current Office IP
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddCurrentWifi}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center"
                >
                  + Add Current Wi-Fi Name
                </button>
              </div>
            </div>

            {/* OPTION 1: SPECIFIC WI-FI NETWORK NAMES */}
            <div className="space-y-3 pt-2 p-5 bg-blue-50/30 rounded-xl border border-blue-100">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-blue-600" />
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Option 1: Specific Authorized Wi-Fi Network Name(s) (SSID)
                </label>
              </div>
              <p className="text-[11px] text-gray-500">
                Employees connected to any of these Wi-Fi network names will automatically be granted access to all portal pages.
              </p>

              {/* Add Wi-Fi Name Input Form */}
              <form onSubmit={handleAddWifi} className="flex gap-2">
                <input
                  type="text"
                  value={newWifiInput}
                  onChange={(e) => setNewWifiInput(e.target.value)}
                  placeholder="e.g. DevBhoomi-WiFi, Office-5G, Staff-Network"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium bg-white"
                />
                <Button type="submit" variant="secondary" size="sm" className="flex items-center">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Wi-Fi Name
                </Button>
              </form>

              {/* Active Allowed Wi-Fi Names Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(settings.allowedWifiNames || []).length === 0 ? (
                  <span className="text-xs text-gray-400 italic">No specific Wi-Fi names configured yet.</span>
                ) : (
                  (settings.allowedWifiNames || []).map((wifi) => (
                    <span
                      key={wifi}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100/70 text-blue-800 border border-blue-200 shadow-2xs"
                    >
                      <Wifi className="w-3 h-3 mr-1 text-blue-600" />
                      {wifi}
                      <button
                        type="button"
                        onClick={() => handleRemoveWifi(wifi)}
                        className="ml-2 text-blue-400 hover:text-red-600 transition-colors"
                        title="Remove Wi-Fi Name"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* OPTION 2: SPECIFIC IP ADDRESSES */}
            <div className="space-y-3 pt-2 p-5 bg-amber-50/30 rounded-xl border border-amber-100">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <label className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Option 2: Specific Authorized IP Address(es) Allowlist
                </label>
              </div>
              <p className="text-[11px] text-gray-500">
                Employees connecting from any of these specific local or public office IP addresses will be granted access.
              </p>

              {/* Add IP Input Form */}
              <form onSubmit={handleAddIP} className="flex gap-2">
                <input
                  type="text"
                  value={newIPInput}
                  onChange={(e) => setNewIPInput(e.target.value)}
                  placeholder="e.g. 127.0.0.1, 192.168.1.1, 10.194.16.2"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono bg-white"
                />
                <Button type="submit" variant="secondary" size="sm" className="flex items-center">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add IP
                </Button>
              </form>

              {/* Active Allowed IPs Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {(settings.allowedIPs || []).length === 0 ? (
                  <span className="text-xs text-gray-400 italic">No specific IP addresses configured yet.</span>
                ) : (
                  (settings.allowedIPs || []).map((ip) => (
                    <span
                      key={ip}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-gray-100 text-gray-800 border border-gray-200"
                    >
                      {ip}
                      <button
                        type="button"
                        onClick={() => handleRemoveIP(ip)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove IP"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Matches if Wi-Fi Name <strong className="text-gray-700">OR</strong> IP Address matches.
              </span>
              <Button onClick={handleSaveSettings} isLoading={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center">
                <Save className="w-4 h-4 mr-1.5" /> Save Network Security Settings
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Dept Form */}
            <form onSubmit={handleAddDepartment} className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4 h-fit">
              <h3 className="text-base font-bold text-gray-900">Add New Department</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Department Name *</label>
                <input
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Quality Assurance"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Responsibilities, division roles..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
              </div>
              <Button type="submit" isLoading={deptLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center">
                <Plus className="w-4 h-4 mr-1.5" /> Create Department
              </Button>
            </form>

            {/* Existing Depts List */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Configured Departments ({departments.length})</h3>
                <Button variant="outline" size="sm" onClick={fetchDepartments} className="text-xs">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                </Button>
              </div>

              <div className="divide-y divide-gray-100">
                {departments.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-400">No departments added yet.</p>
                ) : (
                  departments.map((d) => (
                    <div key={d._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-gray-900">{d.name}</h4>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            {d.employeeCount || 0} employees
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{d.description || 'No description provided'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteDepartment(d._id, d.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY HOLIDAYS */}
        {activeTab === 'holidays' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Holiday Form */}
            <form onSubmit={handleAddHoliday} className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 space-y-4 h-fit">
              <h3 className="text-base font-bold text-gray-900">Add Holiday Event</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Holiday Name *</label>
                <input
                  required
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  placeholder="e.g. Diwali, New Year"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Calendar Date *</label>
                <input
                  required
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Holiday Type</label>
                <select
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Company">Company Holiday</option>
                  <option value="National">National Holiday</option>
                  <option value="Optional">Optional / Floating</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  placeholder="Optional details"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <Button type="submit" isLoading={holidayLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center">
                <Plus className="w-4 h-4 mr-1.5" /> Save Holiday to Calendar
              </Button>
            </form>

            {/* Existing Holidays List */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Scheduled Holidays ({holidays.length})</h3>
                <Button variant="outline" size="sm" onClick={fetchHolidays} className="text-xs">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
                </Button>
              </div>

              <div className="divide-y divide-gray-100">
                {holidays.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-400">No scheduled holidays.</p>
                ) : (
                  holidays.map((h) => (
                    <div key={h._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="text-center px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                          <span className="block text-xs font-mono font-bold text-indigo-700">
                            {new Date(h.date).toLocaleDateString([], { month: 'short' })}
                          </span>
                          <span className="block text-sm font-extrabold text-gray-900">
                            {new Date(h.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-gray-900">{h.name}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                              {h.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{h.date} {h.description ? `• ${h.description}` : ''}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(h._id, h.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
