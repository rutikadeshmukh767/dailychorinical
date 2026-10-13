// Dev: relative /api (proxied by Vite). Prod: VITE_API_URL (your Render URL).
const ROOT = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const BASE = `${ROOT}/api`;

const TOKEN_KEY = 'chronicle_token';
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the press room. The server may be waking up — try again in a moment.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const qs = (params) => {
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  ).toString();
  return s ? `?${s}` : '';
};

export const api = {
  listArticles: (params = {}) => request(`/articles${qs(params)}`),
  categories: () => request('/articles/categories'),
  article: (slug) => request(`/articles/${encodeURIComponent(slug)}`),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),
  adminList: () => request('/articles/admin/all', { auth: true }),
  adminGet: (id) => request(`/articles/admin/${id}`, { auth: true }),
  create: (data) => request('/articles', { method: 'POST', body: data, auth: true }),
  update: (id, data) => request(`/articles/${id}`, { method: 'PUT', body: data, auth: true }),
  remove: (id) => request(`/articles/${id}`, { method: 'DELETE', auth: true }),
};
