import api from './axios';

export const groupApi = {
  createGroup: (formData) => api.post('/groups/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  addMembers: (groupId, userIds) => api.post(`/groups/${groupId}/add-members`, userIds),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/remove-member/${userId}`),
  leaveGroup: (groupId) => api.post(`/groups/${groupId}/leave`),
  promoteToAdmin: (groupId, targetUserId) => api.put(`/groups/${groupId}/promote/${targetUserId}`),
  demoteAdmin: (groupId, targetUserId) => api.put(`/groups/${groupId}/demote/${targetUserId}`),
  updateGroupInfo: (groupId, formData) => api.put(`/groups/${groupId}/info`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),
};
