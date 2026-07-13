import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Token
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

// Interceptor to handle global response errors (e.g. 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.response.config.url || '';
      // If the error occurred on login or registration endpoints, do not redirect to landing page
      if (requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register')) {
        return Promise.reject(error);
      }
      
      console.error("401 Unauthorized API error:", requestUrl, error.response.data);
      // Session expired or unauthenticated
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export default api;
