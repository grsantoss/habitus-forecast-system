// Configuração centralizada da API
export const getApiBaseUrl = () => {
  // Se VITE_API_URL estiver definida, usar ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Se estiver em produção (modo build), usar o domínio de produção
  if (import.meta.env.PROD) {
    return 'https://app.habitusforecast.com.br/api';
  }
  
  // Em desenvolvimento, usar localhost
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

