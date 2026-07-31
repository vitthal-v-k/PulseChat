import api from './axios';

export const friendApi = {
  sendRequest: (receiverId) => api.post(`/friends/request/${receiverId}`),
  acceptRequest: (requestId) => api.post(`/friends/accept/${requestId}`),
  rejectRequest: (requestId) => api.post(`/friends/reject/${requestId}`),
  cancelRequest: (requestId) => api.delete(`/friends/cancel/${requestId}`),
  removeFriend: (friendId) => api.delete(`/friends/remove/${friendId}`),
  blockUser: (targetUserId) => api.post(`/friends/block/${targetUserId}`),
  unblockUser: (targetUserId) => api.post(`/friends/unblock/${targetUserId}`),
  getFriends: (page = 0, size = 20) => api.get('/friends', { params: { page, size } }),
  getReceivedRequests: () => api.get('/friends/requests/received'),
  getSentRequests: () => api.get('/friends/requests/sent'),
};
