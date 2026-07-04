import api from './api';

const tripService = {
  getTrips:        (params)            => api.get('/trips', { params }),
  getMyTrips:      ()                  => api.get('/trips/my'),
  getTripById:     (id)                => api.get(`/trips/${id}`),
  getTripMembers:  (id)                => api.get(`/trips/${id}/members`),
  createTrip:      (data)              => api.post('/trips', data),
  updateTrip:      (id, data)          => api.put(`/trips/${id}`, data),
  deleteTrip:      (id)                => api.delete(`/trips/${id}`),
  joinTrip:        (id)                => api.post(`/trips/${id}/join`),
  leaveTrip:       (id)                => api.post(`/trips/${id}/leave`),
  updateMember:    (id, userId, data)  => api.put(`/trips/${id}/members/${userId}`, data),
};

export default tripService;
