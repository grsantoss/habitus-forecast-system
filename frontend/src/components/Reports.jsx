import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectsAPI } from '../lib/api';
import { toast } from 'sonner';
import { 
  FileText, 
  Clock, 
  Download, 
  CalendarCheck, 
  Plus, 
  Settings, 
  Eye, 
  Share, 
  Trash2, 
  Pause, 
  Pencil,
  BarChart3,
  List,
  BarChart,
  Search,
  Loader2,
  FileSpreadsheet,
  FileX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Skeleton } from './ui/skeleton';

const Reports = () => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  
  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [showPDF, setShowPDF] = useState(false);
  const [showExcel, setShowExcel] = useState(false);
  const [filterScenario, setFilterScenario] = useState('all');
  
  // Modal de geração
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    nome: '',
    formato: 'pdf',
    template: 'executive',
    cenarioId: '',
    cenarioIds: [], // Para comparativo
    periodo: 'todos',
    descricao: ''
  });
  
  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    downloads: 0,
    espacoUsado: 0
  });

  const templates = [
    {
      id: 'executive',
      title: 'Relatório Executivo',
      description: 'Visão geral com gráficos e métricas principais',
      icon: BarChart3,
    },
    {
      id: 'detailed',
      title: 'Relatório Detalhado',
      description: 'Análise completa com todos os dados',
      icon: List,
    },
    {
      id: 'comparison',
      title: 'Comparativo',
      description: 'Comparação entre múltiplos cenários',
      icon: BarChart,
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState('executive');

  useEffect(() => {
    fetchScenarios();
    fetchReports();
    migrateLocalStorageReports();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [reports]);

  const fetchScenarios = async () => {
    try {
      setLoadingScenarios(true);
      const response = await projectsAPI.listScenarios();
      setScenarios(response.data.cenarios || []);
    } catch (err) {
      console.error('Erro ao buscar cenários:', err);
      toast.error('Erro ao carregar cenários');
    } finally {
      setLoadingScenarios(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.listReports();
      setReports(response.data.relatorios || []);
    } catch (err) {
      console.error('Erro ao buscar relatórios:', err);
      toast.error('Erro ao carregar relatórios');
      // Fallback para localStorage em caso de erro
      loadReportsFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadReportsFromStorage = () => {
    try {
      const savedReports = localStorage.getItem('reports_history');
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports);
        setReports(parsedReports);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico de relatórios:', err);
    }
  };

  const migrateLocalStorageReports = async () => {
    try {
      const savedReports = localStorage.getItem('reports_history');
      if (!savedReports) return;
      
      const parsedReports = JSON.parse(savedReports);
      if (!Array.isArray(parsedReports) || parsedReports.length === 0) return;
      
      // Verificar se já migrou (flag no localStorage)
      const migrationFlag = localStorage.getItem('reports_migrated_to_backend');
      if (migrationFlag === 'true') return;
      
      // Migrar relatórios para o backend
      for (const report of parsedReports) {
        try {
          await projectsAPI.createReport({
            title: report.title,
            type: report.type,
            template: report.template || 'detailed',
            scenario: report.scenario,
            scenarioId: report.scenarioId,
            scenarioIds: report.scenarioIds,
            size: report.size,
            pages: report.pages,
            sheets: report.sheets,
            downloads: report.downloads || 0,
            status: report.status || 'completed',
            periodo: report.periodo || 'todos',
            descricao: report.descricao || ''
          });
        } catch (err) {
          console.error('Erro ao migrar relatório:', err);
          // Continuar com os próximos mesmo se um falhar
        }
      }
      
      // Marcar como migrado
      localStorage.setItem('reports_migrated_to_backend', 'true');
      
      // Recarregar relatórios do backend
      await fetchReports();
    } catch (err) {
      console.error('Erro ao migrar relatórios:', err);
    }
  };

  const saveReportToBackend = async (newReport) => {
    try {
      const response = await projectsAPI.createReport({
        title: newReport.title,
        type: newReport.type,
        template: newReport.template,
        scenario: newReport.scenario,
        scenarioId: newReport.scenarioId,
        scenarioIds: newReport.scenarioIds,
        size: newReport.size,
        pages: newReport.pages ? parseInt(newReport.pages) : null,
        sheets: newReport.sheets ? parseInt(newReport.sheets) : null,
        downloads: newReport.downloads || 1,
        status: newReport.status || 'completed',
        periodo: newReport.periodo || 'todos',
        descricao: newReport.descricao || ''
      });
      
      // Adicionar à lista local
      setReports([response.data.relatorio, ...reports]);
      return response.data.relatorio;
    } catch (err) {
      console.error('Erro ao salvar relatório no backend:', err);
      toast.error('Erro ao salvar relatório. Tentando salvar localmente...');
      
      // Fallback para localStorage
      try {
        const updatedReports = [newReport, ...reports];
        localStorage.setItem('reports_history', JSON.stringify(updatedReports));
        setReports(updatedReports);
      } catch (storageErr) {
        console.error('Erro ao salvar no localStorage:', storageErr);
      }
      
      return newReport;
    }
  };

  const calculateStats = () => {
    const total = reports.length;
    const downloads = reports.reduce((sum, r) => sum + (r.downloads || 0), 0);
    const espacoUsado = reports.reduce((sum, r) => {
      if (r.size) {
        const sizeInMB = parseFloat(r.size.replace(' MB', ''));
        return sum + (isNaN(sizeInMB) ? 0 : sizeInMB);
      }
      return sum;
    }, 0);

    setStats({ total, downloads, espacoUsado });
  };

  const handleGenerateReport = async () => {
    // Validação do nome
    if (!reportForm.nome.trim()) {
      toast.error('O nome do relatório é obrigatório');
      return;
    }
    
    // Validação baseada no template
    if (reportForm.template === 'comparison') {
      if (!reportForm.cenarioIds || reportForm.cenarioIds.length < 2) {
        toast.error('Selecione pelo menos 2 cenários para comparar');
        return;
      }
      
      // Validar se os cenários selecionados ainda existem
      const selectedScenarios = scenarios.filter(s => reportForm.cenarioIds.includes(s.id.toString()));
      if (selectedScenarios.length !== reportForm.cenarioIds.length) {
        toast.error('Um ou mais cenários selecionados não foram encontrados. Por favor, recarregue a página.');
        return;
      }
    } else {
      if (!reportForm.cenarioId) {
        toast.error('Selecione um cenário');
        return;
      }
      
      // Validar se o cenário existe
      const selectedScenario = scenarios.find(s => s.id === parseInt(reportForm.cenarioId));
      if (!selectedScenario) {
        toast.error('Cenário selecionado não foi encontrado. Por favor, recarregue a página.');
        return;
      }
    }

    try {
      setGeneratingReport(true);
      
      let response;
      if (reportForm.template === 'comparison') {
        // Usar endpoint de relatório comparativo
        response = await projectsAPI.downloadComparisonReport(
          reportForm.cenarioIds.map(id => parseInt(id)),
          reportForm.formato,
          reportForm.periodo
        );
      } else {
        // Usar endpoint normal com template
        response = await projectsAPI.downloadReport(
          parseInt(reportForm.cenarioId),
          reportForm.formato,
          reportForm.periodo,
          reportForm.template
        );
      }
      
      // Validar se a resposta contém dados
      if (!response.data || response.data.size === 0) {
        toast.error('O relatório gerado está vazio. Verifique se há lançamentos no cenário selecionado.');
        return;
      }
      
      // Ler metadados dos headers HTTP
      const numPages = response.headers['x-report-pages'] || null;
      const numSheets = response.headers['x-report-sheets'] || null;
      
      // Criar blob e fazer download
      const blob = new Blob([response.data], {
        type: reportForm.formato === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = reportForm.formato === 'pdf' ? 'pdf' : 'xlsx';
      const scenario = scenarios.find(s => s.id === parseInt(reportForm.cenarioId));
      const nomeArquivo = `${reportForm.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
      link.download = nomeArquivo;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Salvar metadados do relatório
      let scenarioName = 'N/A';
      if (reportForm.template === 'comparison') {
        const selectedScenarios = scenarios.filter(s => reportForm.cenarioIds.includes(s.id.toString()));
        scenarioName = selectedScenarios.map(s => s.nome).join(', ');
      } else {
        const scenario = scenarios.find(s => s.id === parseInt(reportForm.cenarioId));
        scenarioName = scenario?.nome || 'N/A';
      }
      
      const newReport = {
        id: Date.now(),
        title: reportForm.nome,
        date: new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: reportForm.formato,
        template: reportForm.template,
        scenario: scenarioName,
        scenarioId: reportForm.template === 'comparison' ? null : parseInt(reportForm.cenarioId),
        scenarioIds: reportForm.template === 'comparison' ? reportForm.cenarioIds.map(id => parseInt(id)) : null,
        size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        pages: reportForm.formato === 'pdf' ? (numPages ? parseInt(numPages) : null) : null,
        sheets: reportForm.formato === 'excel' ? (numSheets ? parseInt(numSheets) : null) : null,
        downloads: 1,
        status: 'completed',
        periodo: reportForm.periodo,
        descricao: reportForm.descricao
      };
      
      await saveReportToBackend(newReport);
      
      // Resetar formulário
      setReportForm({
        nome: '',
        formato: 'pdf',
        template: 'executive',
        cenarioId: '',
        cenarioIds: [],
        periodo: 'todos',
        descricao: ''
      });
      setIsGenerateModalOpen(false);
      
      toast.success('Relatório gerado e baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      
      // Tratamento de erros específicos
      let errorMessage = 'Erro ao gerar relatório. Tente novamente.';
      
      if (err.response) {
        // Erro do servidor
        const status = err.response.status;
        const message = err.response.data?.message || '';
        
        if (status === 400) {
          errorMessage = message || 'Dados inválidos. Verifique os parâmetros selecionados.';
        } else if (status === 403) {
          errorMessage = 'Você não tem permissão para gerar este relatório.';
        } else if (status === 404) {
          errorMessage = 'Cenário ou projeto não encontrado.';
        } else if (status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else if (message) {
          errorMessage = message;
        }
      } else if (err.request) {
        // Erro de rede
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast.error(errorMessage);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownload = async (report) => {
    // Verificar se é relatório comparativo
    if (report.template === 'comparison') {
      if (!report.scenarioIds || report.scenarioIds.length < 2) {
        toast.error('IDs de cenários não encontrados para este relatório comparativo. O relatório pode ter sido criado com dados inválidos.');
        return;
      }
      
      try {
        const response = await projectsAPI.downloadComparisonReport(
          report.scenarioIds,
          report.type,
          report.periodo || 'todos'
        );
        
        // Validar resposta
        if (!response.data || response.data.size === 0) {
          toast.error('O relatório está vazio. Os cenários podem não ter mais lançamentos.');
          return;
        }
        
        const blob = new Blob([response.data], {
          type: report.type === 'pdf' 
            ? 'application/pdf' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${report.type === 'pdf' ? 'pdf' : 'xlsx'}`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        // Atualizar contador de downloads no backend
        try {
          const newDownloadCount = (report.downloads || 0) + 1;
          await projectsAPI.updateReport(report.id, { downloads: newDownloadCount });
          
          // Atualizar lista local
          const updatedReports = reports.map(r => 
            r.id === report.id 
              ? { ...r, downloads: newDownloadCount }
              : r
          );
          setReports(updatedReports);
        } catch (err) {
          console.error('Erro ao atualizar downloads:', err);
          // Atualizar localmente mesmo se falhar no backend
          const updatedReports = reports.map(r => 
            r.id === report.id 
              ? { ...r, downloads: (r.downloads || 0) + 1 }
              : r
          );
          setReports(updatedReports);
        }
        
        toast.success('Relatório baixado com sucesso!');
        return;
      } catch (err) {
        console.error('Erro ao baixar relatório comparativo:', err);
        
        // Tratamento de erros específicos
        let errorMessage = 'Erro ao baixar relatório. Tente novamente.';
        
        if (err.response) {
          const status = err.response.status;
          const message = err.response.data?.message || '';
          
          if (status === 400) {
            errorMessage = message || 'Dados inválidos. O relatório pode estar desatualizado.';
          } else if (status === 403) {
            errorMessage = 'Você não tem permissão para baixar este relatório.';
          } else if (status === 404) {
            errorMessage = 'Cenários não encontrados. Eles podem ter sido excluídos.';
          } else if (status === 500) {
            errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          } else if (message) {
            errorMessage = message;
          }
        } else if (err.request) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        }
        
        toast.error(errorMessage);
        return;
      }
    }
    
    if (!report.scenarioId) {
      toast.error('Cenário não encontrado para este relatório. O relatório pode estar desatualizado.');
      return;
    }

    try {
      const response = await projectsAPI.downloadReport(
        report.scenarioId,
        report.type,
        report.periodo || 'todos',
        report.template || 'detailed'
      );
      
      // Validar resposta
      if (!response.data || response.data.size === 0) {
        toast.error('O relatório está vazio. O cenário pode não ter mais lançamentos.');
        return;
      }
      
      const blob = new Blob([response.data], {
        type: report.type === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${report.type === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      // Atualizar contador de downloads
      const updatedReports = reports.map(r => 
        r.id === report.id 
          ? { ...r, downloads: (r.downloads || 0) + 1 }
          : r
      );
      setReports(updatedReports);
      
      toast.success('Relatório baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao baixar relatório:', err);
      
      // Tratamento de erros específicos
      let errorMessage = 'Erro ao baixar relatório. Tente novamente.';
      
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || '';
        
        if (status === 400) {
          errorMessage = message || 'Dados inválidos. O relatório pode estar desatualizado.';
        } else if (status === 403) {
          errorMessage = 'Você não tem permissão para baixar este relatório.';
        } else if (status === 404) {
          errorMessage = 'Cenário não encontrado. Ele pode ter sido excluído.';
        } else if (status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else if (message) {
          errorMessage = message;
        }
      } else if (err.request) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast.error(errorMessage);
    }
  };

  const handleView = async (report) => {
    // Apenas PDFs podem ser visualizados
    if (report.type !== 'pdf') {
      toast.info('A visualização está disponível apenas para relatórios em PDF. Use o botão "Baixar" para arquivos Excel.');
      return;
    }

    try {
      setViewingReport(report.id);
      
      let response;
      if (report.template === 'comparison') {
        if (!report.scenarioIds || report.scenarioIds.length < 2) {
          toast.error('IDs de cenários não encontrados para este relatório comparativo.');
          return;
        }
        
        response = await projectsAPI.downloadComparisonReport(
          report.scenarioIds,
          report.type,
          report.periodo || 'todos'
        );
      } else {
        if (!report.scenarioId) {
          toast.error('Cenário não encontrado para este relatório.');
          return;
        }
        
        response = await projectsAPI.downloadReport(
          report.scenarioId,
          report.type,
          report.periodo || 'todos',
          report.template || 'detailed'
        );
      }
      
      // Validar resposta
      if (!response.data || response.data.size === 0) {
        toast.error('O relatório está vazio. Não é possível visualizar.');
        return;
      }
      
      // Criar blob e abrir em nova aba
      const blob = new Blob([response.data], {
        type: 'application/pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      
      // Abrir PDF em nova aba
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        toast.error('Por favor, permita pop-ups para visualizar o PDF.');
        window.URL.revokeObjectURL(url);
        return;
      }
      
      // Limpar URL após um tempo (quando a janela carregar)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
      toast.success('PDF aberto em nova aba');
    } catch (err) {
      console.error('Erro ao visualizar relatório:', err);
      
      // Tratamento de erros específicos
      let errorMessage = 'Erro ao visualizar relatório. Tente novamente.';
      
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || '';
        
        if (status === 400) {
          errorMessage = message || 'Dados inválidos. O relatório pode estar desatualizado.';
        } else if (status === 403) {
          errorMessage = 'Você não tem permissão para visualizar este relatório.';
        } else if (status === 404) {
          errorMessage = 'Cenário ou projeto não encontrado.';
        } else if (status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
        } else if (message) {
          errorMessage = message;
        }
      } else if (err.request) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast.error(errorMessage);
    } finally {
      setViewingReport(null);
    }
  };

  const handleShare = async (report) => {
    try {
      // Gerar informações do relatório para compartilhar
      const reportInfo = {
        titulo: report.title,
        tipo: report.type,
        template: report.template,
        cenario: report.scenario,
        data: report.date,
        periodo: report.periodo || 'todos',
        descricao: report.descricao || ''
      };
      
      // Criar texto formatado para compartilhar
      const shareText = `Relatório: ${reportInfo.titulo}\n` +
        `Tipo: ${reportInfo.tipo === 'pdf' ? 'PDF' : 'Excel'}\n` +
        `Template: ${reportInfo.template === 'executive' ? 'Executivo' : reportInfo.template === 'detailed' ? 'Detalhado' : 'Comparativo'}\n` +
        `Cenário(s): ${reportInfo.cenario}\n` +
        `Período: ${reportInfo.periodo}\n` +
        `Data: ${reportInfo.data}` +
        (reportInfo.descricao ? `\nDescrição: ${reportInfo.descricao}` : '');
      
      // Copiar para área de transferência
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        toast.success('Informações do relatório copiadas para a área de transferência!');
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('Informações do relatório copiadas para a área de transferência!');
        } catch (err) {
          toast.error('Não foi possível copiar. Tente selecionar e copiar manualmente.');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Erro ao compartilhar relatório:', err);
      toast.error('Erro ao compartilhar relatório. Tente novamente.');
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Tem certeza que deseja excluir este relatório?')) {
      return;
    }

    try {
      await projectsAPI.deleteReport(reportId);
      
      // Atualizar lista local
      const updatedReports = reports.filter(r => r.id !== reportId);
      setReports(updatedReports);
      
      toast.success('Relatório excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao deletar relatório:', err);
      toast.error('Erro ao excluir relatório. Tente novamente.');
      
      // Fallback: remover localmente mesmo se falhar no backend
      const updatedReports = reports.filter(r => r.id !== reportId);
      setReports(updatedReports);
    }
  };

  const filteredReports = reports.filter(report => {
    // Filtro de busca
    if (searchTerm && !report.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro de tipo
    if (showPDF && report.type !== 'pdf') return false;
    if (showExcel && report.type !== 'excel') return false;
    
    // Filtro de cenário
    if (filterScenario !== 'all') {
      const selectedScenarioId = parseInt(filterScenario);
      
      // Para relatórios comparativos (têm scenarioIds)
      if (report.scenarioIds && Array.isArray(report.scenarioIds) && report.scenarioIds.length > 0) {
        // Verificar se o cenário selecionado está na lista de cenários do relatório comparativo
        if (!report.scenarioIds.includes(selectedScenarioId)) {
          return false;
        }
      } 
      // Para relatórios normais (têm scenarioId)
      else if (report.scenarioId !== selectedScenarioId) {
        return false;
      }
    }
    
    return true;
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Geração de Relatórios</h2>
          <p className="text-gray-600 mt-1">Crie e gerencie relatórios financeiros personalizados.</p>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Relatórios</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Downloads</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">{stats.downloads}</div>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Espaço Usado</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">{stats.espacoUsado.toFixed(1)} MB</div>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Templates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Modelos de Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => {
                const IconComponent = template.icon;
                return (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:border-green-500 hover:bg-green-50 ${
                      selectedTemplate === template.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <IconComponent className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h6 className="font-semibold text-gray-900">{template.title}</h6>
                        <p className="text-sm text-gray-500">{template.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Busca */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar relatórios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showPDF" 
                      checked={showPDF}
                      onCheckedChange={setShowPDF}
                    />
                    <label htmlFor="showPDF" className="text-sm font-medium cursor-pointer">
                      PDF
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showExcel" 
                      checked={showExcel}
                      onCheckedChange={setShowExcel}
                    />
                    <label htmlFor="showExcel" className="text-sm font-medium cursor-pointer">
                      Excel
                    </label>
                  </div>
                  <Select value={filterScenario} onValueChange={setFilterScenario}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos os cenários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cenários</SelectItem>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={String(scenario.id)}>
                          {scenario.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gerar Novo Relatório</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nome do Relatório *</label>
                      <Input 
                        placeholder="Ex: Relatório Executivo Q3"
                        value={reportForm.nome}
                        onChange={(e) => setReportForm({...reportForm, nome: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Template *</label>
                      <Select 
                        value={reportForm.template}
                        onValueChange={(value) => {
                          // Reset cenários ao mudar template
                          setReportForm({
                            ...reportForm, 
                            template: value,
                            cenarioId: '',
                            cenarioIds: []
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="executive">Executivo - Visão geral</SelectItem>
                          <SelectItem value="detailed">Detalhado - Análise completa</SelectItem>
                          <SelectItem value="comparison">Comparativo - Múltiplos cenários</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Formato *</label>
                        <Select 
                          value={reportForm.formato}
                          onValueChange={(value) => setReportForm({...reportForm, formato: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o formato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Período *</label>
                        <Select 
                          value={reportForm.periodo}
                          onValueChange={(value) => setReportForm({...reportForm, periodo: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                            <SelectItem value="trimestral">Trimestral</SelectItem>
                            <SelectItem value="anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {reportForm.template === 'comparison' ? (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Cenários para Comparar * (Selecione pelo menos 2)
                        </label>
                        {loadingScenarios ? (
                          <Skeleton className="h-32 w-full" />
                        ) : (
                          <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                            {scenarios.length === 0 ? (
                              <p className="text-sm text-gray-500">Nenhum cenário disponível</p>
                            ) : (
                              scenarios.map((scenario) => (
                                <div key={scenario.id} className="flex items-center space-x-2 mb-2">
                                  <Checkbox
                                    id={`scenario-${scenario.id}`}
                                    checked={reportForm.cenarioIds.includes(String(scenario.id))}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setReportForm({
                                          ...reportForm,
                                          cenarioIds: [...reportForm.cenarioIds, String(scenario.id)]
                                        });
                                      } else {
                                        setReportForm({
                                          ...reportForm,
                                          cenarioIds: reportForm.cenarioIds.filter(id => id !== String(scenario.id))
                                        });
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`scenario-${scenario.id}`}
                                    className="text-sm font-medium cursor-pointer flex-1"
                                  >
                                    {scenario.nome} {!scenario.is_active && <span className="text-gray-500">(Congelado)</span>}
                                  </label>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                        {reportForm.cenarioIds.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            {reportForm.cenarioIds.length} cenário(s) selecionado(s)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium mb-2">Cenário *</label>
                        {loadingScenarios ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select 
                            value={reportForm.cenarioId}
                            onValueChange={(value) => setReportForm({...reportForm, cenarioId: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cenário" />
                            </SelectTrigger>
                            <SelectContent>
                              {scenarios.length === 0 ? (
                                <SelectItem value="" disabled>Nenhum cenário disponível</SelectItem>
                              ) : (
                                scenarios.map((scenario) => (
                                  <SelectItem key={scenario.id} value={String(scenario.id)}>
                                    {scenario.nome} {!scenario.is_active && '(Congelado)'}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                      <Textarea 
                        placeholder="Descrição opcional do relatório"
                        rows={3}
                        value={reportForm.descricao}
                        onChange={(e) => setReportForm({...reportForm, descricao: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsGenerateModalOpen(false)}
                      disabled={generatingReport}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={
                        generatingReport || 
                        !reportForm.nome || 
                        (reportForm.template === 'comparison' 
                          ? (reportForm.cenarioIds.length < 2)
                          : !reportForm.cenarioId)
                      }
                    >
                      {generatingReport ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        'Gerar Relatório'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-64 mb-4" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {[1, 2, 3, 4].map((j) => (
                      <Skeleton key={j} className="h-12" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {reports.length === 0 ? 'Nenhum relatório gerado ainda' : 'Nenhum relatório encontrado'}
              </h3>
              <p className="text-gray-600 mb-6">
                {reports.length === 0 
                  ? 'Comece gerando seu primeiro relatório clicando no botão acima.'
                  : 'Tente ajustar os filtros de busca.'}
              </p>
              {reports.length === 0 && (
                <Button onClick={() => setIsGenerateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Primeiro Relatório
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h5 className="text-lg font-semibold text-gray-900 mb-1">{report.title}</h5>
                      <p className="text-sm text-gray-500">{report.date}</p>
                      {report.descricao && (
                        <p className="text-sm text-gray-600 mt-2">{report.descricao}</p>
                      )}
                    </div>
                    <Badge 
                      variant={report.type === 'pdf' ? 'destructive' : 'default'}
                      className={
                        report.type === 'pdf' 
                          ? 'bg-red-500' 
                          : report.type === 'excel'
                          ? 'bg-green-500'
                          : 'bg-gray-500'
                      }
                    >
                      {report.type === 'pdf' ? 'PDF' : report.type === 'excel' ? 'Excel' : 'Agendado'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Cenário</div>
                      <div className="text-sm font-semibold text-gray-900">{report.scenario}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tamanho</div>
                      <div className="text-sm font-semibold text-gray-900">{report.size}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        {report.type === 'excel' ? 'Planilhas' : 'Páginas'}
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {report.type === 'excel' ? report.sheets : report.pages}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Downloads</div>
                      <div className="text-sm font-semibold text-gray-900">{report.downloads || 0}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleDownload(report)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleView(report)}
                      disabled={viewingReport === report.id || report.type !== 'pdf'}
                    >
                      {viewingReport === report.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Visualizar
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShare(report)}
                    >
                      <Share className="w-4 h-4 mr-1" />
                      Compartilhar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
