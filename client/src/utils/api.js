const BASE_URL = '/api';

async function request(method, path, body = null) {
  const token = localStorage.getItem('token');
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE_URL + path, opts);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || 'Ошибка', code: data.code };
  return data;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const put = (path, body) => request('PUT', path, body);
const del = (path) => request('DELETE', path);

const API = {
  auth: {
    register: (data) => post('/auth/register', data),
    login: (data) => post('/auth/login', data),
    me: () => get('/auth/me'),
    updateProfile: (data) => put('/auth/profile', data),
    getUsers: () => get('/auth/users'),
  },
  content: {
    getBlocks: () => get('/content/blocks'),
    getBlock: (id) => get(`/content/blocks/${id}`),
    getTopic: (id) => get(`/content/topics/${id}`),
    getTechnique: (id) => get(`/content/techniques/${id}`),
    getMethod: (id) => get(`/content/methods/${id}`),
    getTest: (topicId) => get(`/content/topics/${topicId}/test`),
    submitTest: (topicId, data) => post(`/content/topics/${topicId}/test`, data),
  },
  subscription: {
    getPlans: () => get('/subscription/plans'),
    getMy: () => get('/subscription/my'),
    subscribe: (planType) => post('/subscription/subscribe', { planType }),
    cancel: () => post('/subscription/cancel'),
    getHistory: () => get('/subscription/history'),
  },
  progress: {
    updateMethod: (methodId, data) => post(`/progress/method/${methodId}`, data),
    getOverview: () => get('/progress/overview'),
    getRecommendations: () => get('/progress/recommendations'),
    generatePath: () => post('/progress/path/generate'),
  },
  analytics: {
    trackEvent: (data) => post('/analytics/event', data),
    getMy: (days) => get(`/analytics/my?days=${days || 30}`),
    getPlatform: () => get('/analytics/platform'),
    getEffectiveness: (methodId) => get(`/analytics/effectiveness/${methodId}`),
  },
};

export default API;
