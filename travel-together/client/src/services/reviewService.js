import api from './api';

const reviewService = {
  getMyReviews:       (params)         => api.get('/reviews/me', { params }),
  getReviewsGiven:    (params)         => api.get('/reviews/given', { params }),
  getReviewsForUser:  (userId, params) => api.get(`/reviews/user/${userId}`, { params }),
  searchUsers:        (q)              => api.get('/reviews/search-users', { params: { q } }),
  createReview:       (data)           => api.post('/reviews', data),
  deleteReview:       (id)             => api.delete(`/reviews/${id}`),
};

export default reviewService;
