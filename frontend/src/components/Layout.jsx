import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import logoExpanded from '../assets/habitus forecast_v2.svg';
import logoCollapsed from '../assets/favicon habitus forecast.svg';
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  Settings, 
  Users, 
  FileText, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'usuario']
    },
    {
      title: 'Gerenciar Dados',
      icon: Upload,
      path: '/data-upload',
      roles: ['admin', 'usuario']
    },
    {
      title: 'Cenários',
      icon: BarChart3,
      path: '/scenarios',
      roles: ['admin']
    },
    {
      title: 'Relatórios',
      icon: FileText,
      path: '/reports',
      roles: ['admin']
    },
    {
      title: 'Configurações',
      icon: Settings,
      path: '/settings',
      roles: ['admin']
    },
    {
      title: 'Gerenciar Usuários',
      icon: Users,
      path: '/admin/users',
      roles: ['admin']
    },
    {
      title: 'Logs do Sistema',
      icon: FileText,
      path: '/admin/logs',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarExpanded = !sidebarCollapsed;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 bg-black text-white transition-all duration-300 ease-in-out h-full
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center p-4 border-b border-gray-700 ${sidebarExpanded ? 'justify-between' : 'flex-col gap-2'}`}>
            {sidebarExpanded ? (
              <>
                <img 
                  src={logoExpanded} 
                  alt="Habitus Foreca$t" 
                  className="h-10 w-auto object-contain"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-white hover:bg-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <img 
                  src={logoCollapsed} 
                  alt="Habitus Foreca$t" 
                  className="h-10 w-10 object-contain"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-white hover:bg-gray-800 w-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`
                    w-full justify-start text-left h-12 px-3
                    ${isActive 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                    ${!sidebarExpanded ? 'justify-center px-0' : ''}
                  `}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  title={!sidebarExpanded ? item.title : ''}
                >
                  <Icon className={`h-5 w-5 ${sidebarExpanded ? 'mr-3' : ''}`} />
                  {sidebarExpanded && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Button>
              );
            })}
          </nav>

        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Mobile Menu Button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-white shadow-md"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
