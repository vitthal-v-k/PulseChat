import api from './axios';

export const chatApi = {
  getOrCreatePrivateChat: (otherUserId) => api.post(`/chats/private/${otherUserId}`),
  getUserChats: () => api.get('/chats'),
  getChatById: (chatId) => api.get(`/chats/${chatId}`),
  pinChat: (chatId, pin) => api.put(`/chats/${chatId}/pin`, null, { params: { pin } }),
  archiveChat: (chatId, archive) => api.put(`/chats/${chatId}/archive`, null, { params: { archive } }),
  muteChat: (chatId, mute) => api.put(`/chats/${chatId}/mute`, null, { params: { mute } }),
  clearChatHistory: (chatId) => api.delete(`/chats/${chatId}/clear`),
  deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
  markAsUnread: (chatId) => api.put(`/chats/${chatId}/unread`),
};
