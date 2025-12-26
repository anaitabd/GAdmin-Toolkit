import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/api/auth/login', credentials),
    verify: () => api.get('/api/auth/verify')
};

// Users API
export const usersAPI = {
    list: (params) => api.get('/api/users', { params }),
    create: (userData) => api.post('/api/users', userData),
    createBulk: (users) => api.post('/api/users/bulk', { users }),
    uploadCSV: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/users/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    generate: (domain, count) => api.post('/api/users/generate', { domain, count }),
    delete: (userKey) => api.delete(`/api/users/${userKey}`),
    deleteAll: () => api.delete('/api/users')
};

// Status API
export const statusAPI = {
    create: () => api.post('/api/status/operation'),
    get: (operationId) => api.get(`/api/status/${operationId}`),
    update: (operationId, data) => api.put(`/api/status/${operationId}`, data),
    delete: (operationId) => api.delete(`/api/status/${operationId}`)
};

export default api;
