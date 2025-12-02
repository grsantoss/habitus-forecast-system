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
    agendados: 0,
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
    loadReportsFromStorage();
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
      setLoading(false);
    }
  };

  const loadReportsFromStorage = () => {
    try {
      const savedReports = localStorage.getItem('reports_history');
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      }
    } catch (err) {
      console.error('Erro ao carregar histórico de relatórios:', err);
    }
  };

  const saveReportToStorage = (newReport) => {
    try {
      const updatedReports = [newReport, ...reports];
      localStorage.setItem('reports_history', JSON.stringify(updatedReports));
      setReports(updatedReports);
    } catch (err) {
      console.error('Erro ao salvar relatório:', err);
    }
  };

  const calculateStats = () => {
    const total = reports.length;
    const agendados = reports.filter(r => r.type === 'scheduled').length;
    const downloads = reports.reduce((sum, r) => sum + (r.downloads || 0), 0);
    const espacoUsado = reports.reduce((sum, r) => {
      if (r.size) {
        const sizeInMB = parseFloat(r.size.replace(' MB', ''));
        return sum + (isNaN(sizeInMB) ? 0 : sizeInMB);
      }
      return sum;
    }, 0);

    setStats({ total, agendados, downloads, espacoUsado });
  };

  const handleGenerateReport = async () => {
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
    } else {
      if (!reportForm.cenarioId) {
        toast.error('Selecione um cenário');
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
        pages: reportForm.formato === 'pdf' ? '12' : null,
        sheets: reportForm.formato === 'excel' ? '5' : null,
        downloads: 1,
        status: 'completed',
        periodo: reportForm.periodo,
        descricao: reportForm.descricao
      };
      
      saveReportToStorage(newReport);
      
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
      toast.error(err.response?.data?.message || 'Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownload = async (report) => {
    // Verificar se é relatório comparativo
    if (report.template === 'comparison') {
      if (!report.scenarioIds || report.scenarioIds.length < 2) {
        toast.error('IDs de cenários não encontrados para este relatório comparativo');
        return;
      }
      
      try {
        const response = await projectsAPI.downloadComparisonReport(
          report.scenarioIds,
          report.type,
          report.periodo || 'todos'
        );
        
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
        localStorage.setItem('reports_history', JSON.stringify(updatedReports));
        
        toast.success('Relatório baixado com sucesso!');
        return;
      } catch (err) {
        console.error('Erro ao baixar relatório comparativo:', err);
        toast.error('Erro ao baixar relatório. Tente novamente.');
        return;
      }
    }
    
    if (!report.scenarioId) {
      toast.error('Cenário não encontrado para este relatório');
      return;
    }

    try {
      const response = await projectsAPI.downloadReport(
        report.scenarioId,
        report.type,
        report.periodo || 'todos',
        report.template || 'detailed'
      );
      
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
      localStorage.setItem('reports_history', JSON.stringify(updatedReports));
      
      toast.success('Relatório baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao baixar relatório:', err);
      toast.error('Erro ao baixar relatório. Tente novamente.');
    }
  };

  const handleView = (report) => {
    toast.info('Visualização em PDF será implementada em breve');
  };

  const handleDelete = (reportId) => {
    if (!window.confirm('Tem certeza que deseja excluir este relatório?')) {
      return;
    }

    const updatedReports = reports.filter(r => r.id !== reportId);
    setReports(updatedReports);
    localStorage.setItem('reports_history', JSON.stringify(updatedReports));
    toast.success('Relatório excluído com sucesso!');
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
    if (filterScenario !== 'all' && report.scenarioId !== parseInt(filterScenario)) {
      return false;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-sm text-gray-600 mb-1">Agendados</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">{stats.agendados}</div>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
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
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast.info('Compartilhamento será implementado em breve')}
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
