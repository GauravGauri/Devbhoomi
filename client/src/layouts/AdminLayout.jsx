import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Users, Calendar, Settings, FileText, Activity, Clock, Shield } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const AdminLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);

  useEffect(() => {
    const fetchPendingLeaves = async () => {
      try {
        const { data } = await api.get('/admin/leaves?status=Pending');
        setPendingLeavesCount(data.data?.length || 0);
      } catch (err) {
        // quiet fallback
      }
    };
    fetchPendingLeaves();
    const interval = setInterval(fetchPendingLeaves, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Activity },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Attendance', path: '/admin/attendance', icon: Calendar },
    { name: 'Leaves', path: '/admin/leaves', icon: Clock, badge: pendingLeavesCount },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800 space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider leading-tight">DEV BHOOMI</h1>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">Admin Portal</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg group transition-all ${
                    isActive ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20' : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center mb-4">
            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-400">{user?.role || 'Administrator'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
