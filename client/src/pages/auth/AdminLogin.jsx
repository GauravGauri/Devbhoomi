import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ShieldCheck } from 'lucide-react';

const schema = yup.object().shape({
  username: yup.string().required('Username or Email is required'),
  password: yup.string().required('Password is required'),
});

const AdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/admin/login', data);
      login(response.data.data, response.data.token);
      toast.success('Admin logged in successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillAdminDemo = () => {
    setValue('username', 'admin');
    setValue('password', 'SecureAdminPassword123!');
    toast.success('Admin credentials autofilled!');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast('Default root admin credentials can be reset using: npm run create-admin in the server directory.', {
      icon: '🛡️',
      duration: 6000,
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-900 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={40} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          DevBhoomi Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Secure Administrator Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 px-4 py-8 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-700">
          {/* Quick Demo Autofill Pill */}
          <div className="mb-6 p-3 rounded-xl bg-indigo-950/70 border border-indigo-700/50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-indigo-300">Default Admin Credentials</span>
              <p className="text-gray-400 text-[11px]">User: admin / Pass: SecureAdminPassword123!</p>
            </div>
            <button
              type="button"
              onClick={handleFillAdminDemo}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
            >
              Fill In
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                className={`w-full rounded-lg border bg-gray-900/50 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors ${
                  errors.username ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="admin@devbhoomi.local"
                {...register('username')}
              />
              {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className={`w-full rounded-lg border bg-gray-900/50 px-4 py-2.5 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors ${
                  errors.password ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a
                  href="#forgot"
                  onClick={handleForgotPassword}
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : null}
              Sign in to Dashboard
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              ← Back to Employee Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
