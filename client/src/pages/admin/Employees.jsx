import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  KeyRound,
  ShieldAlert,
  UserCheck,
  Building,
  RefreshCw,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    designation: 'Software Engineer',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    status: 'Active',
  });

  const [newPassword, setNewPassword] = useState('');
  const [actionDropdownId, setActionDropdownId] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/employees');
      setEmployees(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch employees');
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

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/employees', formData);
      toast.success('Employee created successfully');
      setShowAddModal(false);
      setFormData({
        employeeId: '',
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        department: '',
        designation: 'Software Engineer',
      });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    }
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setEditFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department?._id || emp.department || '',
      designation: emp.designation || '',
      status: emp.status || 'Active',
    });
    setActionDropdownId(null);
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await api.put(`/admin/employees/${selectedEmployee._id}`, editFormData);
      toast.success('Employee updated successfully');
      setShowEditModal(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const openResetModal = (emp) => {
    setSelectedEmployee(emp);
    setNewPassword('');
    setActionDropdownId(null);
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !newPassword) return;
    try {
      await api.post(`/admin/employees/${selectedEmployee._id}/reset-password`, { password: newPassword });
      toast.success(`Password reset for ${selectedEmployee.name}`);
      setShowResetModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const openDeleteModal = (emp) => {
    setSelectedEmployee(emp);
    setActionDropdownId(null);
    setShowDeleteModal(true);
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      await api.delete(`/admin/employees/${selectedEmployee._id}`);
      toast.success(`Employee ${selectedEmployee.name} removed successfully`);
      setShowDeleteModal(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleToggleStatus = async (emp) => {
    const nextStatus = emp.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await api.patch(`/admin/employees/${emp._id}/status`, {
        status: nextStatus,
        reason: `Administrative status toggle to ${nextStatus}`
      });
      toast.success(`${emp.name} is now ${nextStatus}`);
      setActionDropdownId(null);
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to change employee status');
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.username && emp.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const deptId = emp.department?._id || emp.department;
    const matchesDept = departmentFilter === 'All' || deptId === departmentFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const activeCount = employees.filter(e => e.status === 'Active').length;
  const suspendedCount = employees.filter(e => e.status !== 'Active').length;

  return (
    <AdminLayout>
      <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Employee Directory</h2>
          <p className="text-xs text-gray-500">Manage user profiles, assignments, credentials, and access statuses</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={fetchEmployees} className="flex items-center text-xs">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)} size="sm" className="flex items-center text-xs bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Employee
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Quick Stat Pill Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">Total Employees</span>
              <p className="text-xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {employees.length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-green-600 font-semibold uppercase">Active Status</span>
              <p className="text-xl font-bold text-green-700">{activeCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-red-600 font-semibold uppercase">Inactive / Suspended</span>
              <p className="text-xl font-bold text-red-700">{suspendedCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Directory Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search name, ID, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="All">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-gray-500">
              Showing {filteredEmployees.length} of {employees.length} employees
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department & Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500 text-sm">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mr-2 align-middle"></div>
                      Loading employee directory...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500 text-sm">
                      No employees match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((person) => (
                    <tr key={person._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mr-3">
                            {person.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{person.name}</div>
                            <div className="text-xs text-gray-500 font-mono">ID: {person.employeeId} • @{person.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{person.designation || 'Staff Member'}</div>
                        <div className="text-xs text-indigo-600 font-medium">
                          {person.department?.name || 'General Department'}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail className="w-3.5 h-3.5 mr-1 text-gray-400" /> {person.email}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" /> {person.phone || 'No phone'}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          person.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : person.status === 'Suspended'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {person.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {person.createdAt ? new Date(person.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button
                          onClick={() => setActionDropdownId(actionDropdownId === person._id ? null : person._id)}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {actionDropdownId === person._id && (
                          <div className="absolute right-6 mt-2 w-48 rounded-xl bg-white shadow-xl border border-gray-200 py-1.5 z-20 text-left">
                            <button
                              onClick={() => openEditModal(person)}
                              className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-2 text-indigo-600" /> Edit Details
                            </button>
                            <button
                              onClick={() => handleToggleStatus(person)}
                              className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-2 text-green-600" />
                              {person.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                            </button>
                            <button
                              onClick={() => openResetModal(person)}
                              className="w-full px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <KeyRound className="w-3.5 h-3.5 mr-2 text-amber-600" /> Reset Password
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => openDeleteModal(person)}
                              className="w-full px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Employee
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD EMPLOYEE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Add New Employee Credential</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Employee ID *</label>
                  <input
                    required
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. EMP007"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Username *</label>
                  <input
                    required
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. rahul.sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="rahul@devbhoomi.local"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Password *</label>
                  <input
                    required
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                  <input
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Systems Engineer"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Employee
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EMPLOYEE */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Edit Employee: {selectedEmployee?.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    name="department"
                    value={editFormData.department}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="">None</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                  <input
                    name="designation"
                    value={editFormData.designation}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status</label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Update Employee
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Reset Password: {selectedEmployee?.name}</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-gray-500">
                Set a new password for employee ID <span className="font-semibold text-gray-800">{selectedEmployee?.employeeId}</span>.
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password *</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowResetModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                  Confirm Password Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE EMPLOYEE CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to permanently remove <span className="font-semibold text-gray-800">{selectedEmployee?.name}</span> ({selectedEmployee?.employeeId})? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteEmployee}>
                  Yes, Delete Employee
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Employees;
