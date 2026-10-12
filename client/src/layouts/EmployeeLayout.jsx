import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Clock, Calendar as CalendarIcon, UserCircle, FileText as FileTextIcon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const EmployeeLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            D
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-wider leading-tight">DEV BHOOMI</h1>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Employee Portal</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
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
    </div>
  );
};

export default EmployeeLayout;
