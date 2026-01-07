import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor for error handling
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
  changePassword: (data) => api.post('/auth/change-password', data),
  setup: (credentials) => api.post('/auth/setup', credentials),
};

// Users API
export const usersAPI = {
  generate: (data) => api.post('/users/generate', data),
  create: () => api.post('/users/create'),
  delete: () => api.delete('/users/delete'),
  getAll: (page = 1, limit = 50) => api.get(`/users?page=${page}&limit=${limit}`),
};

// Emails API
export const emailsAPI = {
  sendViaAPI: (data) => api.post('/emails/send-api', data),
  sendViaSMTP: (data) => api.post('/emails/send-smtp', data),
  getBounced: () => api.get('/emails/bounced'),
  getLogs: (page = 1, limit = 50) => api.get(`/emails/logs?page=${page}&limit=${limit}`),
};

export default api;
