import api from './axios';

export const messageApi = {
  sendMessage: (formData) => api.post('/messages/send', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  editMessage: (data) => api.put('/messages/edit', data),
  deleteForMe: (messageId) => api.delete(`/messages/${messageId}/me`),
  deleteForEveryone: (messageId) => api.delete(`/messages/${messageId}/everyone`),
  getChatMessages: (chatId, page = 0, size = 30) => api.get(`/messages/chat/${chatId}`, {
    params: { page, size },
  }),
  searchMessages: (chatId, query, page = 0, size = 20) => api.get(`/messages/chat/${chatId}/search`, {
    params: { query, page, size },
  }),
  toggleStar: (messageId) => api.post(`/messages/${messageId}/star`),
  getStarredMessages: (page = 0, size = 20) => api.get('/messages/starred', { params: { page, size } }),
  forwardMessage: (messageId, targetChatId) => api.post(`/messages/${messageId}/forward/${targetChatId}`),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, null, { params: { emoji } }),
  markAsRead: (chatId) => api.post(`/messages/chat/${chatId}/read`),
};
