import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedBaseURL = rawUrl.endsWith('/api')
  ? rawUrl
  : `${rawUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: normalizedBaseURL,
  withCredentials: true,
});

// Attach Authorization Bearer token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
