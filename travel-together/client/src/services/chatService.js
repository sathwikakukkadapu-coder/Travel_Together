import api from './api';

const chatService = {
  getConversations:      ()                => api.get('/chat/conversations'),
  getUnreadCount:        ()                => api.get('/chat/unread-count'),
  getMessages:           (userId, params)  => api.get(`/chat/${userId}`, { params }),
  sendMessage:           (userId, data)    => api.post(`/chat/${userId}`, data),
  markConversationRead:  (userId)          => api.put(`/chat/${userId}/read`),
  deleteMessage:         (messageId)       => api.delete(`/chat/message/${messageId}`),
};

export default chatService;
