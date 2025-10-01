import axios from 'axios';

// Configuração base da API
const API_BASE_URL = 'http://localhost:5000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funções de autenticação
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (nome, email, password, role = 'usuario') => 
    api.post('/auth/register', { nome, email, password, role }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Funções de projetos
export const projectsAPI = {
  list: () => api.get('/projetos'),
  create: (data) => api.post('/projetos', data),
  get: (id) => api.get(`/projetos/${id}`),
  update: (id, data) => api.put(`/projetos/${id}`, data),
  delete: (id) => api.delete(`/projetos/${id}`),
  createScenario: (projectId, data) => api.post(`/projetos/${projectId}/cenarios`, data),
};

// Funções de upload
export const uploadAPI = {
  uploadSpreadsheet: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-planilha', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  validateSpreadsheet: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/validar-planilha', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Funções de dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCashFlow: (projectId) => api.get(`/dashboard/fluxo-caixa/${projectId}`),
  getCategoriesData: (projectId) => api.get(`/dashboard/categorias/${projectId}`),
  getPlatformActivity: () => api.get('/dashboard/atividade-plataforma'),
  getActiveUsers: () => api.get('/dashboard/usuarios-ativos'),
};

// Funções administrativas
export const adminAPI = {
  listUsers: (page = 1, perPage = 10, search = '') => 
    api.get(`/admin/usuarios?page=${page}&per_page=${perPage}&search=${search}`),
  createUser: (data) => api.post('/admin/usuarios', data),
  updateUser: (id, data) => api.put(`/admin/usuarios/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/usuarios/${id}`),
  getLogs: (page = 1, perPage = 50, acao = '', usuarioId = null) => {
    let url = `/admin/logs?page=${page}&per_page=${perPage}`;
    if (acao) url += `&acao=${acao}`;
    if (usuarioId) url += `&usuario_id=${usuarioId}`;
    return api.get(url);
  },
  getAdminStats: () => api.get('/admin/estatisticas'),
  listAllProjects: (page = 1, perPage = 10, search = '') => 
    api.get(`/admin/projetos?page=${page}&per_page=${perPage}&search=${search}`),
};

export default api;
