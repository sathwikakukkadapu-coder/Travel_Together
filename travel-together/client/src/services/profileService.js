import api from './api';

const profileService = {
  getMyProfile:         ()              => api.get('/profile/me'),
  updateMyProfile:      (data)          => api.put('/profile/me', data),
  updateAvatar:         (data)          => api.put('/profile/me/avatar', data),
  getCompletion:        ()              => api.get('/profile/me/completion'),
  getProfileById:       (userId)        => api.get(`/profile/${userId}`),
  addTravelHistory:     (data)          => api.post('/profile/me/travel-history', data),
  deleteTravelHistory:  (index)         => api.delete(`/profile/me/travel-history/${index}`),
};

export default profileService;
