import axios from 'axios';

// Configuração base da API a partir de variáveis de ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  listScenarios: () => api.get('/cenarios'),
  updateScenario: (cenarioId, data) => api.put(`/cenarios/${cenarioId}`, data),
  deleteScenario: (cenarioId) => api.delete(`/cenarios/${cenarioId}`),
  getScenarioAnalysis: (cenarioId) => api.get(`/cenarios/${cenarioId}/analise`),
  listLancamentos: (cenarioId) => api.get(`/cenarios/${cenarioId}/lancamentos`),
  createLancamento: (cenarioId, data) => api.post(`/cenarios/${cenarioId}/lancamentos`, data),
  updateLancamento: (cenarioId, lancamentoId, data) => api.put(`/cenarios/${cenarioId}/lancamentos/${lancamentoId}`, data),
  deleteLancamento: (cenarioId, lancamentoId) => api.delete(`/cenarios/${cenarioId}/lancamentos/${lancamentoId}`),
  listCategorias: () => api.get('/categorias'),
  getScenarioCharts: (cenarioId, periodo = 'mensal') => api.get(`/cenarios/${cenarioId}/graficos?periodo=${periodo}`),
  compareScenarios: (cenarioIds) => api.post('/cenarios/comparar', { cenario_ids: cenarioIds }),
  downloadReport: (cenarioId, format, periodo = 'todos', template = 'detailed') => {
    const url = `/cenarios/${cenarioId}/relatorio/${format}?periodo=${periodo}&template=${template}`;
    return api.get(url, { 
      responseType: 'blob',
      // Expor headers customizados
      headers: {
        'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  },
  downloadComparisonReport: (cenarioIds, format, periodo = 'todos') => {
    const endpoint = format === 'pdf' 
      ? '/cenarios/relatorio-comparativo/pdf'
      : '/cenarios/relatorio-comparativo/excel';
    return api.post(endpoint, { 
      cenario_ids: cenarioIds,
      periodo: periodo
    }, { 
      responseType: 'blob',
      // Expor headers customizados
      headers: {
        'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  },
  createSnapshot: (cenarioId, descricao = '') => api.post(`/cenarios/${cenarioId}/snapshot`, { descricao }),
  listHistorico: (cenarioId) => api.get(`/cenarios/${cenarioId}/historico`),
  restoreVersion: (cenarioId, historicoId) => api.post(`/cenarios/${cenarioId}/restaurar/${historicoId}`),
  // Relatórios
  listReports: () => api.get('/relatorios'),
  createReport: (data) => api.post('/relatorios', data),
  getReport: (id) => api.get(`/relatorios/${id}`),
  updateReport: (id, data) => api.put(`/relatorios/${id}`, data),
  deleteReport: (id) => api.delete(`/relatorios/${id}`),
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
      timeout: 300000, // 5 minutos para uploads grandes
      onUploadProgress: (progressEvent) => {
        // Progresso será gerenciado pelo componente
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
      timeout: 60000, // 1 minuto para validação
    });
  },
  rename: (id, nome) => api.put(`/uploads/${id}/rename`, { nome }),
};

// Funções de dashboard
export const dashboardAPI = {
  getStats: (usuarioId = null) => 
    usuarioId 
      ? api.get(`/dashboard/stats?usuario_id=${usuarioId}`)
      : api.get('/dashboard/stats'),
  getCashFlow: (projectId, scenario = 'Realista', usuarioId = null) => {
    const params = new URLSearchParams();
    if (scenario) {
      params.append('cenario', scenario);
    }
    if (usuarioId) {
      params.append('usuario_id', usuarioId);
    }
    const query = params.toString();
    const suffix = query ? `?${query}` : '';
    return api.get(`/dashboard/fluxo-caixa/${projectId}${suffix}`);
  },
  getCategoriesData: (projectId) => api.get(`/dashboard/categorias/${projectId}`),
  getPlatformActivity: () => api.get('/dashboard/atividade-plataforma'),
  getActiveUsers: () => api.get('/dashboard/usuarios-ativos'),
  getSaldoInicial: (usuarioId = null) => 
    usuarioId
      ? api.get(`/dashboard/saldo-inicial?usuario_id=${usuarioId}`)
      : api.get('/dashboard/saldo-inicial'),
  updateSaldoInicial: (saldoInicial, usuarioId = null) => {
    const qs = usuarioId ? `?usuario_id=${usuarioId}` : '';
    return api.post(`/dashboard/saldo-inicial${qs}`, { saldo_inicial: saldoInicial });
  },
  updatePontoEquilibrio: (pontoEquilibrio, usuarioId = null) => {
    const qs = usuarioId ? `?usuario_id=${usuarioId}` : '';
    return api.post(`/dashboard/ponto-equilibrio${qs}`, { ponto_equilibrio: pontoEquilibrio });
  },
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
