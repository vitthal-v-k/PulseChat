import api from './axios';

export const storyApi = {
  createStatus: (formData) => api.post('/status/create', formData),
  getContactStatuses: () => api.get('/status/contacts'),
  getMyStatuses: () => api.get('/status/me'),
  viewStatus: (statusId, replyText = null) => api.post(`/status/${statusId}/view`, null, {
    params: replyText ? { replyText } : {},
  }),
  reactToStatus: (statusId, emoji) => api.post(`/status/${statusId}/react`, null, {
    params: { emoji },
  }),
  deleteStatus: (statusId) => api.delete(`/status/${statusId}`),
};
