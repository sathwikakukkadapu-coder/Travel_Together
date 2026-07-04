import api from './api';

const authService = {
  register:       (data)              => api.post('/auth/register', data),
  login:          (data)              => api.post('/auth/login', data),
  logout:         ()                  => api.post('/auth/logout'),
  getMe:          ()                  => api.get('/auth/me'),
  changePassword: (data)              => api.put('/auth/change-password', data),
};

export default authService;
