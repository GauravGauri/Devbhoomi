import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedBaseURL = rawUrl.endsWith('/api')
  ? rawUrl
  : `${rawUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: normalizedBaseURL,
  withCredentials: true,
});

// Attach Authorization Bearer token and Wi-Fi SSID header from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const wifiName = localStorage.getItem('client_wifi_name');
    if (wifiName) {
      config.headers['x-wifi-name'] = wifiName;
    }

    try {
      const storedCoords = sessionStorage.getItem('client_geo_coords');
      if (storedCoords) {
        const parsed = JSON.parse(storedCoords);
        if (parsed.latitude && parsed.longitude) {
          config.headers['x-latitude'] = String(parsed.latitude);
          config.headers['x-longitude'] = String(parsed.longitude);
        }
      }
    } catch (e) {}

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
