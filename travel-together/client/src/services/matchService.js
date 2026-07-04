import api from './api';

const matchService = {
  getMatches:      (params)  => api.get('/match', { params }),
  getTopMatches:   (limit=5) => api.get('/match/top', { params: { limit } }),
  getMatchScore:   (userId)  => api.get(`/match/score/${userId}`),
  getFilterOptions:()        => api.get('/match/filters'),
};

export default matchService;
