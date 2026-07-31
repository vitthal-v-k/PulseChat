import api from './axios';

export const notificationApi = {
  getNotifications: (page = 0, size = 20) => api.get('/notifications', { params: { page, size } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};
