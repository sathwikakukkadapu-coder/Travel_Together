import api from './api';

const notificationService = {
  getNotifications:  (params) => api.get('/notifications', { params }),
  getUnreadCount:    ()       => api.get('/notifications/unread-count'),
  markOneRead:       (id)     => api.put(`/notifications/${id}/read`),
  markAllRead:       ()       => api.put('/notifications/read-all'),
  deleteOne:         (id)     => api.delete(`/notifications/${id}`),
  deleteAllRead:     ()       => api.delete('/notifications/read'),
};

export default notificationService;
