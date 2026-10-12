import React, { useContext, useState } from 'react';
import EmployeeLayout from '../../layouts/EmployeeLayout';
import { AuthContext } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  User,
  Mail,
  Phone,
  Building,
  KeyRound,
  Edit2,
  Calendar,
  CheckCircle2,
  Shield,
  X,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, login } = useContext(AuthContext);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const openEdit = () => {
    setEditData({
      name: user?.name || '',
      phone: user?.phone || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const { data } = await api.put('/auth/profile', editData);
      login({ ...user, ...data.data });
      toast.success('Profile updated successfully');
      setShowEditModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <EmployeeLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Employee Profile</h2>
          <p className="text-xs text-gray-500">Manage your personal credentials, contact info, and security credentials</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-8 max-w-3xl space-y-8">
          {/* Header Card */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-3xl shadow-xs">
                {user?.name?.charAt(0) || 'E'}
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{user?.name || 'Employee'}</h3>
                <p className="text-sm font-medium text-blue-600">{user?.designation || 'Staff Member'}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> Active Account
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} className="flex items-center text-xs">
                <KeyRound className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Change Password
              </Button>
              <Button size="sm" onClick={openEdit} className="flex items-center text-xs bg-blue-600 hover:bg-blue-700 text-white">
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
              </Button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <span>Employee Identification</span>
              </div>
              <p className="text-base font-bold text-gray-900 font-mono">{user?.employeeId || 'EMP-001'}</p>
            </div>

            <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Username</span>
              </div>
              <p className="text-base font-bold text-gray-900 font-mono">@{user?.username || 'user'}</p>
            </div>

            <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Work Email Address</span>
              </div>
              <p className="text-base font-bold text-gray-900">{user?.email || 'email@devbhoomi.local'}</p>
            </div>

            <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>Contact Phone</span>
              </div>
              <p className="text-base font-bold text-gray-900 font-mono">{user?.phone || 'Not specified'}</p>
            </div>

            <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                <span>Department</span>
              </div>
              <p className="text-base font-bold text-gray-900">{user?.department?.name || 'General Operations'}</p>
            </div>

            <div className="bg-gray-50/60 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Joined Organization</span>
              </div>
              <p className="text-base font-bold text-gray-900 font-mono">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: EDIT PROFILE */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Edit Profile Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  required
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="e.g. 9058085467"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={editLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHANGE PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Change Security Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password *</label>
                <input
                  required
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password *</label>
                <input
                  required
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password *</label>
                <input
                  required
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Repeat new password"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={passwordLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
};

export default Profile;
