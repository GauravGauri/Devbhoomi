import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Login from './pages/auth/Login';
import AdminLogin from './pages/auth/AdminLogin';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import LeaveRequests from './pages/employee/LeaveRequests';
import Profile from './pages/employee/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import Employees from './pages/admin/Employees';
import AdminAttendance from './pages/admin/Attendance';
import AdminLeaves from './pages/admin/Leaves';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

const App = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">Loading DevBhoomi...</div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/employee/dashboard"} /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/employee/dashboard"} /> : <Login />} />
        <Route path="/admin/login" element={user ? <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/employee/dashboard"} /> : <AdminLogin />} />
        
        {/* Protected Employee Routes */}
        <Route path="/employee/dashboard" element={user && user.role === 'employee' ? <EmployeeDashboard /> : <Navigate to="/login" />} />
        <Route path="/employee/attendance" element={user && user.role === 'employee' ? <EmployeeDashboard /> : <Navigate to="/login" />} />
        <Route path="/employee/leaves" element={user && user.role === 'employee' ? <LeaveRequests /> : <Navigate to="/login" />} />
        <Route path="/employee/profile" element={user && user.role === 'employee' ? <Profile /> : <Navigate to="/login" />} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/employees" element={user && user.role === 'admin' ? <Employees /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/attendance" element={user && user.role === 'admin' ? <AdminAttendance /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/leaves" element={user && user.role === 'admin' ? <AdminLeaves /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/reports" element={user && user.role === 'admin' ? <AdminReports /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/settings" element={user && user.role === 'admin' ? <AdminSettings /> : <Navigate to="/admin/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
