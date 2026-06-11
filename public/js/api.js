// ========== API CLIENT ==========
const API = {
  baseUrl: '/api',

  async request(method, path, body = null) {
    const token = localStorage.getItem('token');
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this.baseUrl + path, opts);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, message: data.error || 'Ошибка', code: data.code };
    return data;
  },

  get: (path) => API.request('GET', path),
  post: (path, body) => API.request('POST', path, body),
  put: (path, body) => API.request('PUT', path, body),
  delete: (path) => API.request('DELETE', path),

  // Auth
  auth: {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    me: () => API.get('/auth/me'),
    updateProfile: (data) => API.put('/auth/profile', data),
    getUsers: () => API.get('/auth/users'),
  },

  // Content
  content: {
    getBlocks: () => API.get('/content/blocks'),
    getBlock: (id) => API.get(`/content/blocks/${id}`),
    getTopic: (id) => API.get(`/content/topics/${id}`),
    getTechnique: (id) => API.get(`/content/techniques/${id}`),
    getMethod: (id) => API.get(`/content/methods/${id}`),
    getTest: (topicId) => API.get(`/content/topics/${topicId}/test`),
    submitTest: (topicId, data) => API.post(`/content/topics/${topicId}/test`, data),
  },

  // Subscription
  subscription: {
    getPlans: () => API.get('/subscription/plans'),
    getMy: () => API.get('/subscription/my'),
    subscribe: (planType) => API.post('/subscription/subscribe', { planType }),
    cancel: () => API.post('/subscription/cancel'),
    getHistory: () => API.get('/subscription/history'),
  },

  // Progress
  progress: {
    updateMethod: (methodId, data) => API.post(`/progress/method/${methodId}`, data),
    getOverview: () => API.get('/progress/overview'),
    getRecommendations: () => API.get('/progress/recommendations'),
    generatePath: () => API.post('/progress/path/generate'),
  },

  // Analytics
  analytics: {
    trackEvent: (data) => API.post('/analytics/event', data),
    getMy: (days) => API.get(`/analytics/my?days=${days || 30}`),
    getPlatform: () => API.get('/analytics/platform'),
    getEffectiveness: (methodId) => API.get(`/analytics/effectiveness/${methodId}`),
  }
};
