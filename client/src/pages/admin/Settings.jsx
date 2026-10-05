import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    networkRestrictionEnabled: false,
    allowedIPs: '127.0.0.1',
    officeStartTime: '09:30',
    officeEndTime: '18:30',
    gracePeriod: 15
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/admin/settings');
        if (data.data) {
          setSettings({
            ...data.data,
            allowedIPs: data.data.allowedIPs.join(', ')
          });
        }
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        allowedIPs: settings.allowedIPs.split(',').map(ip => ip.trim()).filter(Boolean)
      };
      await api.put('/admin/settings', payload);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="p-8">Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-8">
        <form onSubmit={handleSave}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Network Security</h3>
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Enable Network Restriction</h4>
                  <p className="text-xs text-gray-500">Only allow attendance marking from authorized IPs</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="networkRestrictionEnabled" checked={settings.networkRestrictionEnabled} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Public IP Addresses (comma separated)</label>
                <input type="text" name="allowedIPs" value={settings.allowedIPs} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="127.0.0.1, 192.168.1.1" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Attendance Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Start Time</label>
                <input type="time" name="officeStartTime" value={settings.officeStartTime} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office End Time</label>
                <input type="time" name="officeEndTime" value={settings.officeEndTime} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (Minutes)</label>
                <input type="number" name="gracePeriod" value={settings.gracePeriod} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button type="submit" isLoading={saving}>Save All Settings</Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
