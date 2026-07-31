import api from './axios';

export const userApi = {
  getMe: () => api.get('/users/me'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadProfilePicture: (formData) => api.post('/users/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.put('/users/change-password', data),
  searchUsers: (query, page = 0, size = 20) => api.get('/users/search', {
    params: { query, page, size },
  }),
};
