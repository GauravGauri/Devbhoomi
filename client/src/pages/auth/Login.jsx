import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { UserCircle, Wifi, WifiOff } from 'lucide-react';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const { data } = await api.get('/attendance/network-status');
        setNetworkStatus(data);
      } catch (err) {
        // silent fail
      }
    };
    fetchNetwork();
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      login(response.data.data, response.data.token);
      toast.success('Logged in successfully');
      navigate('/employee/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast('Please contact your administrator to reset your employee password.', {
      icon: 'ℹ️',
      duration: 6000,
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold text-2xl">
            DB
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          DevBhoomi
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Employee Attendance Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-xl shadow-blue-900/5 sm:rounded-2xl sm:px-10 border border-gray-100">
          {/* Network check banner */}
          {networkStatus && (
            <div className="mb-6">
              {networkStatus.authorized ? (
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-2 rounded-xl">
                  <Wifi className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-semibold">Office Wi-Fi Connected ({networkStatus.clientWifiName || 'Office Network'})</span>
                </div>
              ) : networkStatus.restrictionEnabled ? (
                <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-800 text-xs px-3 py-2 rounded-xl">
                  <WifiOff className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Office Wi-Fi Not Connected: </span>
                    <span>Portal actions restricted to office Wi-Fi or registered IP.</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Username"
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              {...register('username')}
              error={errors.username?.message}
            />

            <Input
              label="Password"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a
                  href="#forgot"
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" isLoading={isLoading}>
              Sign in to Employee Portal
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/admin/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
              Are you an Admin? Login to Admin Console →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
