import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests and add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fleet_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to inspect X-Cache header and track telemetry
api.interceptors.response.use(
  (response) => {
    const cacheStatus = response.headers['x-cache'];
    const cacheKey = response.headers['x-cache-key'];
    if (cacheStatus) {
      window.dispatchEvent(
        new CustomEvent('fleet:cache_event', {
          detail: {
            status: cacheStatus,
            key: cacheKey,
            url: response.config.url,
            time: new Date().toLocaleTimeString(),
          },
        })
      );
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Service Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const vehicleAPI = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  getMyAssigned: () => api.get('/vehicles/assigned/me'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  getStats: () => api.get('/vehicles/stats'),
};

export const serviceAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

export const insuranceAPI = {
  getAll: (params) => api.get('/insurance', { params }),
  getById: (id) => api.get(`/insurance/${id}`),
  create: (data) => api.post('/insurance', data),
  update: (id, data) => api.put(`/insurance/${id}`, data),
  delete: (id) => api.delete(`/insurance/${id}`),
  getAlerts: () => api.get('/insurance/alerts'),
};

export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

export const problemReportAPI = {
  getAll: (params) => api.get('/problem-reports', { params }),
  getById: (id) => api.get(`/problem-reports/${id}`),
  create: (data) => api.post('/problem-reports', data),
  update: (id, data) => api.put(`/problem-reports/${id}`, data),
  delete: (id) => api.delete(`/problem-reports/${id}`),
};

export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getSummary: () => api.get('/expenses/summary'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCacheStatus: () => api.get('/dashboard/cache/status'),
  flushCache: () => api.post('/dashboard/cache/flush'),
};

export default api;
