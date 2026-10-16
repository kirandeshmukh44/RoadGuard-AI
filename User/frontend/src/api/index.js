import api from './axios';

// Auth API
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getCurrentUser: () => api.get('/api/auth/me'),
};

// Pothole API
export const potholeAPI = {
  detect: (formData) => api.post('/api/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  detectVideo: (formData) => api.post('/api/detect/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  detectBatch: (formData) => api.post('/api/detect/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  create: (formData) => api.post('/api/potholes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: (params) => api.get('/api/potholes', { params }),
  getMapPotholes: () => api.get('/api/map/potholes'),
  getById: (id) => api.get(`/api/potholes/${id}`),
  update: (id, data) => api.put(`/api/potholes/${id}`, data),
  delete: (id) => api.delete(`/api/potholes/${id}`),
  getMyPotholes: () => api.get('/api/users/me/potholes'),
  getMyPotholesWithReports: () => api.get('/api/users/me/potholes-with-reports'),
  generateReport: (id) => api.post(`/api/potholes/${id}/report`),
  search: (params) => api.get('/api/search/potholes', { params }),
};

// Reports API
export const reportAPI = {
  getAll: () => api.get('/api/reports'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getAllUsers: () => api.get('/api/admin/users'),
  updateUserRole: (userId, role) => api.put(`/api/admin/users/${userId}/role`, { role }),
  // Model training
  registerDataset: (data) => api.post('/api/admin/datasets', data),
  getDatasets: () => api.get('/api/admin/datasets'),
  startTraining: (config) => api.post('/api/admin/training/start', config),
  getModelVersions: () => api.get('/api/admin/training/versions'),
  deployModel: (versionId) => api.post(`/api/admin/training/deploy/${versionId}`),
  getDeployedModel: () => api.get('/api/admin/training/deployed'),
  // Notifications
  testNotification: (data) => api.post('/api/admin/notifications/test', data),
  sendDailySummary: () => api.post('/api/admin/notifications/daily-summary'),
  // Export
  exportCSV: () => api.get('/api/export/potholes/csv', { responseType: 'blob' }),
  exportGeoJSON: () => api.get('/api/export/potholes/geojson'),
  exportSummaryPDF: () => api.get('/api/export/reports/summary', { responseType: 'blob' }),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (days = 30) => api.get('/api/analytics/overview', { params: { days } }),
  getHeatmap: (bounds) => api.get('/api/analytics/heatmap', { params: { bounds } }),
  getRoadCondition: (roadName) => api.get(`/api/analytics/road-condition/${encodeURIComponent(roadName)}`),
};

// Health check
export const healthCheck = () => api.get('/api/health');

// WebSocket
export const createDetectionWebSocket = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/^http/, 'ws')}/ws/detect`
    : `${wsProtocol}//${window.location.host}/ws/detect`;
  return new WebSocket(wsUrl);
};
