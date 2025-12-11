import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { dashboardAPI, projectsAPI, adminAPI } from '../lib/api';
import { API_BASE_URL } from '../lib/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Activity, PiggyBank, Coins, RotateCcw, Plus, Download, FileSpreadsheet } from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]); // Todos os projetos disponíveis
  const [selectedProject, setSelectedProject] = useState(null);
  const [cashFlowData, setCashFlowData] = useState([]);
  const [categoriesData, setCategoriesData] = useState({ entradas: [], saidas: [] });
  const [loading, setLoading] = useState(true);
  const [scenariosList, setScenariosList] = useState([
    { id: 1, name: 'Cenário Base', active: true },
    { id: 2, name: 'Cenário Otimista', active: false },
    { id: 3, name: 'Cenário Pessimista', active: false },
    { id: 4, name: 'Expansão 2024', active: false }
  ]);
  const [chartPeriod, setChartPeriod] = useState('Realista');
  const [scenarios, setScenarios] = useState({
    pessimista: 0,
    realista: 0,
    otimista: 0,
    agressivo: 0
  });
  const [saldoInicial, setSaldoInicial] = useState(0);
  
  // Estados para os novos campos
  const [saldoInicialCaixa, setSaldoInicialCaixa] = useState('');
  const [saldoInicialFixo, setSaldoInicialFixo] = useState(''); // Novo estado para valor fixo
  const [pontoEquilibrioReais, setPontoEquilibrioReais] = useState('');
  const [pontoEquilibrioFixo, setPontoEquilibrioFixo] = useState('');
  const [pontoEquilibrioPercentual, setPontoEquilibrioPercentual] = useState('');
  const [dataBase, setDataBase] = useState('');
  const [chartKey, setChartKey] = useState(0); // Para forçar re-render do gráfico
  const [visibleLines, setVisibleLines] = useState({ habitusForecast: true, fdcReal: false });
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);

  useEffect(() => {
    loadDashboardData();

    // Carregar cenários do usuário
    // Para usuário comum: carregar cenários do próprio usuário
    // Para admin: carregar cenários próprios se não tiver cliente selecionado,
    // ou cenários do cliente quando um cliente for selecionado
    if (user?.role !== 'admin') {
      loadScenarios();
    } else {
      // Admin: carregar cenários próprios se não tiver cliente selecionado
      loadScenarios(null);
    }
    
    // Definir data-base padrão como mês atual
    const now = new Date();
    const currentMonth = now.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
    const currentYear = now.getFullYear().toString().slice(-2);
    const defaultBase = `${currentMonth}/${currentYear}`;
    setDataBase(defaultBase);
    
    // Listener para exclusão de arquivos
    const handleUploadDeleted = (event) => {
      loadDashboardData();
    };
    
    window.addEventListener('uploadDeleted', handleUploadDeleted);

    // Se for admin, carregar lista de clientes (usuários comuns)
    if (user?.role === 'admin') {
      adminAPI.listUsers(1, 100, '')
        .then((response) => {
          const usuarios = response.data.usuarios || [];
          const apenasClientes = usuarios.filter(u => u.role === 'usuario');
          setClients(apenasClientes);
        })
        .catch((error) => {
          console.error('Erro ao carregar clientes para o dashboard:', error);
        });
    }
    
    return () => {
      window.removeEventListener('uploadDeleted', handleUploadDeleted);
    };
  }, [user]);

  // Restaurar cliente selecionado do localStorage (admin) ao montar
  useEffect(() => {
    if (user?.role === 'admin') {
      const storedId = localStorage.getItem('adminSelectedClientId');
      if (storedId) {
        const parsedId = parseInt(storedId, 10);
        if (!Number.isNaN(parsedId)) {
          setSelectedClientId(parsedId);
        }
      }
    }
  }, [user]);

  // Validar cliente selecionado após carregar lista de clientes
  useEffect(() => {
    if (user?.role === 'admin' && selectedClientId && clients.length > 0) {
      const clientExists = clients.some(c => c.id === selectedClientId);
      if (!clientExists) {
        // Cliente não existe mais, limpar seleção
        console.warn(`Cliente ID ${selectedClientId} não existe mais. Limpando seleção.`);
        setSelectedClientId(null);
        localStorage.removeItem('adminSelectedClientId');
      }
    }
  }, [clients, selectedClientId, user]);

  // useEffect específico para carregar saldo inicial
  useEffect(() => {
    loadSaldoInicial();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject);
    } else {
      // Se não há projeto selecionado, limpar os dados
      setCashFlowData([]);
      setCategoriesData({ entradas: [], saidas: [] });
    }
  }, [selectedProject]);

  // Forçar re-render do gráfico quando data-base mudar
  useEffect(() => {
    if (dataBase) {
      // Forçar re-render do gráfico
      setChartKey(prev => prev + 1);
    }
  }, [dataBase]);

  // Recarregar dados do projeto quando o cenário (chartPeriod) mudar
  useEffect(() => {
    // É necessário ter um projeto selecionado
    if (!selectedProject) return;

    // Admin pode usar seus próprios cenários quando não tem cliente selecionado
    // Não precisa bloquear o recarregamento

    loadProjectData(selectedProject);
    setChartKey(prev => prev + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartPeriod]);

  // Quando admin trocar de cliente, recarregar dados do dashboard e saldo inicial
  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardData();
      loadSaldoInicial();
      loadScenarios(selectedClientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  const loadDashboardData = async () => {
    try {
      const usuarioId = user?.role === 'admin' ? selectedClientId : null;

      const [statsResponse, projectsResponse] = await Promise.all([
        dashboardAPI.getStats(usuarioId),
        projectsAPI.list()
      ]);

      let projetos = projectsResponse.data.projetos || [];

      // Se admin escolheu um cliente, filtrar projetos desse usuário
      if (user?.role === 'admin' && usuarioId) {
        projetos = projetos.filter(p => p.usuario_id === usuarioId);
      }

      setStats(statsResponse.data);
      setProjects(projetos);
      setAllProjects(projetos); // Armazenar todos os projetos
      
      // Sempre selecionar o projeto mais recente (último criado)
      if (projetos.length > 0) {
        // Ordenar projetos por data de criação (mais recente primeiro)
        const projetosOrdenados = [...projetos].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        const projetoMaisRecente = projetosOrdenados[0];
        setSelectedProject(projetoMaisRecente.id);
      } else {
        // Se não há projetos, limpar localStorage e não selecionar nenhum projeto
        localStorage.removeItem('lastUploadedProjectId');
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Se erro 401, redirecionar para login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (projectId) => {
    try {
      const usuarioId = user?.role === 'admin' ? selectedClientId : null;
      const [cashFlowResponse, categoriesResponse] = await Promise.all([
        dashboardAPI.getCashFlow(projectId, chartPeriod, usuarioId),
        dashboardAPI.getCategoriesData(projectId)
      ]);

      setCashFlowData(cashFlowResponse.data.dados_fluxo || []);
      setCategoriesData(categoriesResponse.data);
    } catch (error) {
      console.error('Erro ao carregar dados do projeto:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  // Função para lidar com mudança de seleção do projeto
  const handleProjectSelectChange = (projectId) => {
    const selectedProj = allProjects.find(p => p.id === parseInt(projectId));
    if (selectedProj) {
      setSelectedProject(selectedProj.id);
      loadProjectData(selectedProj.id);
      // Forçar re-render do gráfico
      setChartKey(prev => prev + 1);
    }
  };

  // Função para carregar saldo inicial
  const loadSaldoInicial = async () => {
    try {
      const usuarioId = user?.role === 'admin' ? selectedClientId : null;

      // Para admin sem cliente selecionado, limpar campos e não chamar API
      if (user?.role === 'admin' && !usuarioId) {
        setSaldoInicial(0);
        setSaldoInicialCaixa('');
        setSaldoInicialFixo('');
        setPontoEquilibrioReais('');
        setPontoEquilibrioFixo('');
        return;
      }

      const response = await dashboardAPI.getSaldoInicial(usuarioId);
      
      const saldo = response.data.saldo_inicial || 0;
      setSaldoInicial(saldo);
      
      // Garantir que o saldo seja um número
      const saldoNumerico = typeof saldo === 'number' ? saldo : parseFloat(saldo) || 0;
      const saldoFormatado = formatCurrency(saldoNumerico);
      
      setSaldoInicialCaixa(saldoFormatado);
      setSaldoInicialFixo(saldoFormatado); // Definir valor fixo também
      
      // Carregar ponto de equilíbrio também
      const pontoEquilibrio = response.data.ponto_equilibrio || 0;
      const pontoEquilibrioFormatado = formatCurrency(pontoEquilibrio);
      setPontoEquilibrioReais(pontoEquilibrioFormatado);
      setPontoEquilibrioFixo(pontoEquilibrioFormatado);
    } catch (error) {
      console.error('Erro ao carregar saldo inicial:', error);
      console.error('Detalhes do erro:', error.response?.data);
    }
  };

  // Função para limpar o campo de saldo inicial
  const limparSaldoInicial = () => {
    setSaldoInicial(0);
    setSaldoInicialCaixa('');
    setSaldoInicialFixo(''); // Limpar valor fixo também
    
    // Atualizar no backend também
    updateSaldoInicial(0);
  };

  // Função para atualizar saldo inicial
  const updateSaldoInicial = async (novoSaldo) => {
    try {
      const usuarioId = user?.role === 'admin' ? selectedClientId : null;
      
      // Validar se o cliente existe antes de enviar
      if (user?.role === 'admin' && usuarioId) {
        const clientExists = clients.some(c => c.id === usuarioId);
        if (!clientExists) {
          console.error('Cliente selecionado não existe mais');
          setSelectedClientId(null);
          localStorage.removeItem('adminSelectedClientId');
          return;
        }
      }
      
      const response = await dashboardAPI.updateSaldoInicial(novoSaldo, usuarioId);
      setSaldoInicial(novoSaldo);
      
      // Recarregar dados do projeto para atualizar o gráfico
      if (selectedProject) {
        await loadProjectData(selectedProject);
      }
    } catch (error) {
      console.error('Erro ao atualizar saldo inicial:', error);
      
      // Se erro 404 (usuário não encontrado), limpar seleção
      if (error.response?.status === 404) {
        console.warn('Usuário não encontrado. Limpando seleção de cliente.');
        setSelectedClientId(null);
        localStorage.removeItem('adminSelectedClientId');
      }
    }
  };

  const loadScenarios = async (usuarioId = null) => {
    try {
      const token = localStorage.getItem('token');
      const qs =
        user?.role === 'admin' && usuarioId
          ? `?usuario_id=${usuarioId}`
          : '';

      const response = await fetch(`${API_BASE_URL}/settings/cenarios${qs}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScenarios({
          pessimista: data.pessimista || 0,
          realista: data.realista || 0,
          otimista: data.otimista || 0,
          agressivo: data.agressivo || 0
        });
      } else if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro ao carregar cenários:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Função para formatar valores monetários (recebe sempre um número)
  const formatCurrency = (value) => {
    if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
    }
    // Se não for um número, retorna string vazia
    return '';
  };

  // Função para interpretar valor digitado pelo usuário (formato brasileiro)
  const interpretUserValue = (value) => {
    if (typeof value === 'string' && value) {
      // Remove 'R$', espaços e separadores de milhares (pontos)
      let cleanedValue = value.replace(/R\$\s?|\./g, '');
      // Substitui a vírgula decimal por ponto para parseFloat
      cleanedValue = cleanedValue.replace(/,/g, '.');
      
      if (cleanedValue === '') return 0;
      
      const parsed = parseFloat(cleanedValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Função para lidar com mudanças nos campos monetários
  const handleCurrencyChange = (value, setter) => {
    // Garantir que o valor é uma string
    const stringValue = String(value || '');
    const formatted = formatCurrency(stringValue);
    setter(formatted);
  };

  // Função para lidar com mudanças no ponto de equilíbrio
  const handlePontoEquilibrioChange = (value) => {
    const stringValue = String(value || '');
    const interpretedAmount = interpretUserValue(stringValue);
    
    if (interpretedAmount < 0) {
      alert('O ponto de equilíbrio não pode ser negativo');
      return;
    }
    
    setPontoEquilibrioReais(stringValue);
    setPontoEquilibrioFixo(formatCurrency(interpretedAmount));
    
    // Salvar no backend com debounce
    clearTimeout(window.pontoEquilibrioTimeout);
    window.pontoEquilibrioTimeout = setTimeout(() => {
      updatePontoEquilibrio(interpretedAmount);
    }, 500);
  };

  // Função para atualizar ponto de equilíbrio no backend
  const updatePontoEquilibrio = async (novoPontoEquilibrio) => {
    try {
      const usuarioId = user?.role === 'admin' ? selectedClientId : null;
      
      // Validar se o cliente existe antes de enviar
      if (user?.role === 'admin' && usuarioId) {
        const clientExists = clients.some(c => c.id === usuarioId);
        if (!clientExists) {
          console.error('Cliente selecionado não existe mais');
          setSelectedClientId(null);
          localStorage.removeItem('adminSelectedClientId');
          return;
        }
      }
      
      await dashboardAPI.updatePontoEquilibrio(novoPontoEquilibrio, usuarioId);
    } catch (error) {
      console.error('Erro ao atualizar ponto de equilíbrio:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      // Se erro 404 (usuário não encontrado), limpar seleção
      if (error.response?.status === 404) {
        console.warn('Usuário não encontrado. Limpando seleção de cliente.');
        setSelectedClientId(null);
        localStorage.removeItem('adminSelectedClientId');
      } else if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  // Função para limpar o ponto de equilíbrio
  const limparPontoEquilibrio = () => {
    setPontoEquilibrioReais('');
    setPontoEquilibrioFixo('');
    // Atualizar no backend também
    updatePontoEquilibrio(0);
  };

  // Função específica para lidar com mudanças no saldo inicial
  const handleSaldoInicialChange = useCallback((value) => {
    const stringValue = String(value || '');
    
    // 1. Interpretar o valor digitado pelo usuário para obter o número real
    const interpretedAmount = interpretUserValue(stringValue);
    
    // 2. Validar o valor interpretado
    if (interpretedAmount > 1000000) {
      alert('O saldo inicial não pode ser maior que R$ 1.000.000,00');
      return; // Impede a atualização
    } else if (interpretedAmount < 0) {
      alert('O saldo inicial não pode ser negativo');
      return; // Impede a atualização
    }
    
    // 3. Durante a digitação: não aplicar máscara para permitir valores expressivos
    setSaldoInicialCaixa(stringValue);
    setSaldoInicialFixo(formatCurrency(interpretedAmount)); // Definir valor fixo
    
    // 4. Usar debounce para evitar múltiplas chamadas de API
    clearTimeout(window.saldoInicialTimeout);
    window.saldoInicialTimeout = setTimeout(() => {
      updateSaldoInicial(interpretedAmount);
    }, 500); // Aguardar 500ms após o usuário parar de digitar
  }, [saldoInicialCaixa, interpretUserValue, formatCurrency, updateSaldoInicial]);

  // Função para gerar os meses baseados na data-base selecionada
  const generateMonthsFromBase = (baseDate) => {
    if (!baseDate) {
      // Se não há data-base, usar mês atual
      const now = new Date();
      baseDate = `${now.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}/${now.getFullYear().toString().slice(-2)}`;
    }
    
    const months = [];
    const [monthStr, yearStr] = baseDate.split('/');
    // Remover ponto se existir (ex: "OUT." -> "OUT")
    const cleanMonthStr = monthStr.replace('.', '');
    const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const monthIndex = monthNames.indexOf(cleanMonthStr);
    const year = parseInt('20' + yearStr);
    
    // Começar exatamente no mês selecionado
    let currentDate = new Date(year, monthIndex, 1);
    
    for (let i = 0; i < 12; i++) {
      const month = currentDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
      const yearShort = currentDate.getFullYear().toString().slice(-2);
      const monthYear = `${month}/${yearShort}`;
      months.push(monthYear);
      
      // Avançar para o próximo mês
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return months;
  };


  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Função para aplicar cenários aos dados
  const applyScenarioToData = (data, scenarioType) => {
    if (!data || data.length === 0) return data;
    
    const scenarioPercent = scenarios[scenarioType.toLowerCase()] || 0;
    const multiplier = 1 + (scenarioPercent / 100);
    
    return data.map(item => {
      // Não aplicar o multiplicador sobre o saldo inicial; apenas sobre a habitus forecast base
      const saldoParaAdicionar = Number(saldoInicial || 0);
      const receitaSemSaldo = Number(item.receita || 0) - saldoParaAdicionar;
      const receitaAposCenario = Math.round(receitaSemSaldo * multiplier + saldoParaAdicionar);

      return {
        ...item,
        receita: receitaAposCenario,
        fdc_real: item.fdc_real,
        despesas: item.despesas
      };
    });
  };

  // Obter dados do gráfico baseado no cenário selecionado
  const getChartData = () => {
    // Gerar meses baseados na data-base selecionada
    const months = generateMonthsFromBase(dataBase);
    
    // Se não há dados reais, retornar array vazio
    if (cashFlowData.length === 0) {
      return [];
    }
    
    // Mapear dados do backend para os meses do gráfico
    const baseData = months.map((monthStr, index) => {
      // Usar o índice para mapear diretamente os dados
      const correspondingData = cashFlowData[index];
      
      const result = correspondingData ? {
        ...correspondingData,
        mes: monthStr
      } : {
        mes: monthStr,
        receita: 0,
        fdc_real: 0,
        saldo: 0
      };
      return result;
    });
    
    // Os cenários já são aplicados no backend; apenas garantir fdc_real definido
    const finalData = baseData.map(item => ({
      ...item,
      fdc_real: item.fdc_real || 0
    }));
    return finalData;
  };

  // Função para calcular a receita total anual (último valor da linha verde)
  const getReceitaTotalAnual = () => {
    const chartData = getChartData();
    if (chartData.length === 0) return 0;
    
    // Pegar o último valor da linha verde (Habitus Foreca$t) que já tem o cenário aplicado
    const ultimoMes = chartData[chartData.length - 1];
    return ultimoMes?.receita || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Dados para a tabela - usar dados reais ou vazios
  const financialData = stats?.total_projetos > 0 ? [
    { periodo: 'Abr/2025', receita: 5000, custosVariaveis: 2500, despesasFixas: 1000, investimentos: 1000, lucroLiquido: 7500, margem: 15 },
    { periodo: 'Mai/2025', receita: 5000, custosVariaveis: 2600, despesasFixas: 1000, investimentos: 0, lucroLiquido: 8400, margem: 16 },
    { periodo: 'Jun/2025', receita: 5000, custosVariaveis: 3250, despesasFixas: 1000, investimentos: 0, lucroLiquido: 9750, margem: 18 },
    { periodo: 'Jul/2025', receita: 5000, custosVariaveis: 3800, despesasFixas: 1100, investimentos: 5000, lucroLiquido: 10100, margem: 18 },
    { periodo: 'Ago/2025', receita: 5000, custosVariaveis: 3350, despesasFixas: 1100, investimentos: 0, lucroLiquido: 10550, margem: 19 }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Visão geral dos seus dados financeiros e cenários.</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Olá, {user?.nome}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <Download className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.total_projetos > 0 ? formatCurrency(getReceitaTotalAnual()) : 'R$ 0,00'}
          </div>
          <div className="text-sm text-gray-600">Receita Total Anual</div>
        </Card>

        <Card className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.total_projetos > 0
              ? formatCurrency(stats?.indicadores?.geracao_fdc_livre || 0)
              : 'R$ 0,00'}
          </div>
          <div className="text-sm text-gray-600">Geração FDC Livre</div>
        </Card>

        <Card className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.total_projetos > 0
              ? formatCurrency(stats?.indicadores?.ponto_equilibrio || 0)
              : 'R$ 0,00'}
          </div>
          <div className="text-sm text-gray-600">Ponto de Equilíbrio</div>
        </Card>

        <Card className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.total_projetos > 0
              ? `${(stats?.indicadores?.percentual_custo_fixo || 0).toFixed(2)}%`
              : '0,00%'}
          </div>
          <div className="text-sm text-gray-600">% Custo Fixo</div>
        </Card>
        </div>
        
      {/* Nova Seção - Blocos de Configuração */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data-base</label>
            <Select value={dataBase} onValueChange={setDataBase}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() + i);
                  const month = date.toLocaleDateString('pt-BR', { month: 'short' });
                  const year = date.getFullYear().toString().slice(-2);
                  return (
                    <SelectItem key={i} value={`${month.toUpperCase()}/${year}`}>
                      {month.toUpperCase()}/{year}
                  </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Saldo Inicial Caixa (total)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.,R$\s]*"
                value={saldoInicialCaixa}
                onChange={(e) => {
                  handleSaldoInicialChange(e.target.value);
                }}
                onFocus={(e) => {
                  // Remover máscara ao focar para permitir edição contínua
                  const raw = interpretUserValue(e.target.value);
                  const rawStr = raw === 0 ? '' : String(e.target.value);
                  setSaldoInicialCaixa(rawStr);
                }}
                onBlur={(e) => {
                  // Reaplicar máscara ao sair do campo
                  const amount = interpretUserValue(e.target.value);
                  setSaldoInicialCaixa(formatCurrency(amount));
                }}
                placeholder="R$ 0,00"
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {saldoInicialFixo && (
                <button
                  onClick={() => {
                    limparSaldoInicial();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  title="Limpar valor"
                >
                  ✕
                </button>
              )}
            </div>
            {saldoInicialFixo && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                Valor fixo: {saldoInicialFixo}
          </div>
        )}
      </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ponto de Equilíbrio (R$)</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9.,R$\s]*"
                value={pontoEquilibrioReais}
                onChange={(e) => handlePontoEquilibrioChange(e.target.value)}
                onFocus={(e) => {
                  // Remover máscara ao focar para permitir edição contínua
                  const raw = interpretUserValue(e.target.value);
                  const rawStr = raw === 0 ? '' : String(e.target.value);
                  setPontoEquilibrioReais(rawStr);
                }}
                onBlur={(e) => {
                  // Reaplicar máscara ao sair do campo
                  const amount = interpretUserValue(e.target.value);
                  setPontoEquilibrioReais(formatCurrency(amount));
                }}
                placeholder="R$ 0,00"
                className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {pontoEquilibrioFixo && (
                <button
                  onClick={limparPontoEquilibrio}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  title="Limpar valor"
                >
                  ✕
                </button>
              )}
            </div>
            {pontoEquilibrioFixo && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                Valor fixo: {pontoEquilibrioFixo}
              </div>
            )}
          </div>
        </Card>

        </div>
        
      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 mb-6 items-stretch">
        {/* Revenue vs Expense Chart */}
        <div>
          <Card className="h-full min-h-[520px]">
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
        <div>
                    <h5 className="text-base sm:text-lg font-semibold text-gray-900">Habitus Foreca$t vs FDC-Real</h5>
                    {getChartData().length > 0 && scenarios[chartPeriod.toLowerCase()] > 0 && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Cenário {chartPeriod}: +{scenarios[chartPeriod.toLowerCase()]}% de crescimento
                      </p>
                    )}
                  </div>
        </div>
        
                {/* Linha única responsiva: seletor + checkboxes + botões */}
              <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  {/* Seletor de cliente apenas para admin */}
                  {user?.role === 'admin' && clients.length > 0 && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Cliente:</label>
                      <Select
                        value={selectedClientId ? String(selectedClientId) : '__none__'}
                        onValueChange={(id) => {
                          if (id === '__none__') {
                            setSelectedClientId(null);
                            localStorage.removeItem('adminSelectedClientId');
                          } else {
                            const parsedId = parseInt(id, 10);
                            setSelectedClientId(parsedId);
                            localStorage.setItem('adminSelectedClientId', String(parsedId));
                          }
                        }}
                      >
                        <SelectTrigger className="w-[260px]">
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            Nenhum cliente (visão global)
                          </SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.nome} ({c.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {allProjects.length > 0 && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">Selecionar arquivo:</label>
                      <Select
                        value={selectedProject ? String(selectedProject) : ''}
                        onValueChange={handleProjectSelectChange}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Selecione um arquivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {allProjects.map((project) => (
                            <SelectItem key={project.id} value={String(project.id)}>
                              {project.nome_arquivo || project.nome_cliente || `Projeto ${project.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {getChartData().length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center space-x-3 border rounded-md px-3 py-1.5">
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-green-600"
                            style={{ accentColor: '#2FCB6E' }}
                            checked={visibleLines.habitusForecast}
                            onChange={(e) => setVisibleLines(prev => ({ ...prev, habitusForecast: e.target.checked }))}
                          />
                          <span className="text-sm text-gray-700">Habitus Foreca$t</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 accent-green-600"
                            style={{ accentColor: '#2FCB6E' }}
                            checked={visibleLines.fdcReal}
                            onChange={(e) => setVisibleLines(prev => ({ ...prev, fdcReal: e.target.checked }))}
                          />
                          <span className="text-sm text-gray-700">FDC-Real</span>
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={chartPeriod === 'Pessimista' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartPeriod('Pessimista')}
                          className="text-xs sm:text-sm"
                        >
                          Pessimista
                        </Button>
                        <Button
                          variant={chartPeriod === 'Realista' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartPeriod('Realista')}
                          className="text-xs sm:text-sm"
                        >
                          Realista
                        </Button>
                        <Button
                          variant={chartPeriod === 'Otimista' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartPeriod('Otimista')}
                          className="text-xs sm:text-sm"
                        >
                          Otimista
                        </Button>
                        <Button
                          variant={chartPeriod === 'Agressivo' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartPeriod('Agressivo')}
                          className="text-xs sm:text-sm"
                        >
                          Agressivo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
      </div>
              <div className="h-[280px] sm:h-[360px] px-2 sm:px-4">
                {getChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      key={chartKey}
                      data={getChartData()}
                      margin={{ top: 20, right: 10, left: 50, bottom: 20 }}
                    >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)}
                        width={50}
                        tick={{ fontSize: 10 }}
                      />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                      {visibleLines.habitusForecast && (
                  <Line 
                    type="monotone" 
                          dataKey="receita" 
                          stroke="#2FCB6E" 
                          strokeWidth={3}
                          name="Habitus Foreca$t"
                          dot={{ fill: '#2FCB6E', strokeWidth: 2, r: 4 }}
                        />
                      )}
                      {visibleLines.fdcReal && (
                  <Line 
                    type="monotone" 
                          dataKey="fdc_real" 
                          stroke="#000000" 
                          strokeWidth={3}
                          name="FDC-Real"
                          dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
                        />
                      )}
                </LineChart>
              </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <FileText className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum dado disponível
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Faça upload de uma planilha Habitus Foreca$t para visualizar os dados do gráfico.
                    </p>
                    <Button 
                      onClick={() => window.location.href = '/data-upload'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Fazer Upload de Planilha
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Financial Data and Cost Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Financial Data Table - 75% width */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h5 className="text-lg font-semibold text-gray-900">Projeção Financeira</h5>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto flex-1 p-6">
              <table className="w-full h-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entradas operacionais</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custos Variáveis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custos fixos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade de investimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade de financiamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Geração de caixa</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 h-full">
                  {financialData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.periodo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.receita)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.custosVariaveis)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.despesasFixas)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.investimentos)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(row.lucroLiquido)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.margem}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </Card>
        </div>

        {/* Cost Distribution Chart - 25% width */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <div className="p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-6">Composição do FDC</h5>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Custos de Vendas', value: 35, color: '#2FCB6E' },
                        { name: 'Impostos', value: 8, color: '#27a359' },
                        { name: 'Pessoal', value: 25, color: '#7fe0a3' },
                        { name: 'Administrativo', value: 20, color: '#000000' },
                        { name: 'Financeiro', value: 12, color: '#333333' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {[
                        { name: 'Custos de Vendas', value: 35, color: '#2FCB6E' },
                        { name: 'Impostos', value: 8, color: '#27a359' },
                        { name: 'Pessoal', value: 25, color: '#7fe0a3' },
                        { name: 'Administrativo', value: 20, color: '#000000' },
                        { name: 'Financeiro', value: 12, color: '#333333' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#2FCB6E' }}></div>
                  <span className="text-sm text-gray-700">Custos de Vendas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#27a359' }}></div>
                  <span className="text-sm text-gray-700">Impostos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7fe0a3' }}></div>
                  <span className="text-sm text-gray-700">Pessoal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#000000' }}></div>
                  <span className="text-sm text-gray-700">Administrativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#333333' }}></div>
                  <span className="text-sm text-gray-700">Financeiro</span>
                </div>
              </div>
            </div>
            </Card>
        </div>
        </div>


      {/* Empty State */}
      {projects.length === 0 && (
        <Card className="mt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum projeto encontrado
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Comece criando um novo projeto ou fazendo upload de uma planilha Habitus Foreca$t.
            </p>
            <Button 
              onClick={() => window.location.href = '/data-upload'}
              className="bg-green-600 hover:bg-green-700"
            >
              Fazer Upload de Planilha
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
