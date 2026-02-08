const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: headers(
      options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }
    ),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),

  // Clients
  getClients: () => request('/clients'),
  getClient: (id: string) => request(`/clients/${id}`),
  createClient: (data: any) =>
    request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) =>
    request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) =>
    request(`/clients/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: (clientId?: string) =>
    request(`/projects${clientId ? `?clientId=${clientId}` : ''}`),
  getProject: (id: string) => request(`/projects/${id}`),
  createProject: (data: any) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: any) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  // Documents
  getDocuments: (projectId?: string) =>
    request(`/documents${projectId ? `?projectId=${projectId}` : ''}`),
  createDocument: (data: any) =>
    request('/documents', { method: 'POST', body: JSON.stringify(data) }),
  updateDocument: (id: string, data: any) =>
    request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDocument: (id: string) =>
    request(`/documents/${id}`, { method: 'DELETE' }),
};
