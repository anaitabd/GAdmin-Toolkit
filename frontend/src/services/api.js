import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  verifyToken: (token) => api.post('/auth/verify', { token }),
};

// Users API
export const usersAPI = {
  generateUsers: (data) => api.post('/users/generate', data),
  createUsers: (csvPath) => api.post('/users/create', { csvPath }),
  createSingleUser: (userData) => api.post('/users/create-single', userData),
  deleteUser: (userKey) => api.delete(`/users/${userKey}`),
  deleteAllUsers: () => api.delete('/users/delete-all'),
  listUsers: (excludeAdmin = true) => api.get('/users/list', { params: { excludeAdmin } }),
  importCSV: (formData) => api.post('/users/import-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;
