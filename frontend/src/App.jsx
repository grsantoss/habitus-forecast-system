import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DataUpload from './components/DataUpload';
import './App.css';

// Criar cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para redirecionar usuários autenticados
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

// Componentes placeholder para as outras páginas
const Scenarios = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Cenários</h1>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Página de cenários em desenvolvimento...</p>
    </div>
  </div>
);

const Reports = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Página de relatórios em desenvolvimento...</p>
    </div>
  </div>
);

const Settings = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Página de configurações em desenvolvimento...</p>
    </div>
  </div>
);

const AdminUsers = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Página de gerenciamento de usuários em desenvolvimento...</p>
    </div>
  </div>
);

const AdminLogs = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-gray-900">Logs do Sistema</h1>
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600">Página de logs do sistema em desenvolvimento...</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            {/* Rotas protegidas */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="data-upload" element={<DataUpload />} />
              <Route path="scenarios" element={<Scenarios />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin/users" element={<AdminUsers />} />
              <Route path="admin/logs" element={<AdminLogs />} />
            </Route>

            {/* Rota catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
