import api from './api';

const groupChatService = {
  getTripInfo:    (tripId)         => api.get(`/group-chat/${tripId}`),
  getMessages:    (tripId, params) => api.get(`/group-chat/${tripId}/messages`, { params }),
  sendMessage:    (tripId, data)   => api.post(`/group-chat/${tripId}/messages`, data),
};

export default groupChatService;
