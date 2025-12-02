import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { projectsAPI } from '../lib/api';
import { 
  BarChart3, 
  CheckCircle, 
  Lock, 
  CalendarCheck, 
  Plus, 
  BarChart, 
  Eye, 
  Pencil, 
  FileText, 
  Lock as LockIcon, 
  Trash2, 
  Unlock,
  Filter,
  X,
  Loader2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import ScenarioAnalysisModal from './ScenarioAnalysisModal';
import ScenarioComparisonModal from './ScenarioComparisonModal';

const Scenarios = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showActive, setShowActive] = useState(false);
  const [showFrozen, setShowFrozen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedScenario1, setSelectedScenario1] = useState('');
  const [selectedScenario2, setSelectedScenario2] = useState('');
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedScenarioForAnalysis, setSelectedScenarioForAnalysis] = useState(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedScenariosForComparison, setSelectedScenariosForComparison] = useState([]);
  
  // Estados para diálogo de relatório
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedScenarioForReport, setSelectedScenarioForReport] = useState(null);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportPeriod, setReportPeriod] = useState('todos');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Buscar cenários do backend
  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectsAPI.listScenarios();
      setScenarios(response.data.cenarios || []);
    } catch (err) {
      console.error('Erro ao buscar cenários:', err);
      setError('Erro ao carregar cenários. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const filteredScenarios = scenarios.filter(scenario => {
    if (showActive && showFrozen) return true;
    if (showActive && !showFrozen) return scenario.is_active;
    if (!showActive && showFrozen) return !scenario.is_active;
    return true;
  });

  // Calcular estatísticas
  const totalScenarios = scenarios.length;
  const activeScenarios = scenarios.filter(s => s.is_active).length;
  const frozenScenarios = scenarios.filter(s => !s.is_active).length;
  const thisMonthScenarios = scenarios.filter(s => {
    if (!s.created_at) return false;
    const created = new Date(s.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const handleScenarioClick = (scenarioId) => {
    setActiveScenario(scenarioId);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNewScenario = () => {
    navigate('/data-upload');
  };

  const handleCompare = () => {
    setComparisonMode(true);
  };

  const handleCompareScenarios = () => {
    if (!selectedScenario1 || !selectedScenario2) {
      alert('Por favor, selecione dois cenários para comparar.');
      return;
    }
    if (selectedScenario1 === selectedScenario2) {
      alert('Selecione cenários diferentes para comparar.');
      return;
    }
    
    // Abrir modal de comparação
    setSelectedScenariosForComparison([
      parseInt(selectedScenario1),
      parseInt(selectedScenario2)
    ]);
    setComparisonModalOpen(true);
  };

  const handleCloseComparisonModal = () => {
    setComparisonModalOpen(false);
    setSelectedScenariosForComparison([]);
    handleExitCompare(); // Sair do modo comparação
  };

  const handleExitCompare = () => {
    setComparisonMode(false);
    setSelectedScenario1('');
    setSelectedScenario2('');
  };

  const handleViewScenario = (scenarioId, e) => {
    e.stopPropagation(); // Prevenir clique no Card
    navigate(`/dashboard?scenario=${scenarioId}`);
  };

  const handleEditScenario = (scenarioId, e) => {
    e.stopPropagation();
    setSelectedScenarioForAnalysis(scenarioId);
    setAnalysisModalOpen(true);
  };

  const handleCloseAnalysisModal = () => {
    setAnalysisModalOpen(false);
    setSelectedScenarioForAnalysis(null);
  };

  const handleScenarioUpdated = () => {
    // Recarregar lista de cenários quando um cenário for atualizado
    fetchScenarios();
  };

  const handleGenerateReport = (scenarioId, e) => {
    e.stopPropagation();
    setSelectedScenarioForReport(scenarioId);
    setShowReportDialog(true);
  };

  const handleGenerateReportSubmit = async () => {
    if (!selectedScenarioForReport) return;

    try {
      setGeneratingReport(true);
      
      const response = await projectsAPI.downloadReport(
        selectedScenarioForReport,
        reportFormat,
        reportPeriod
      );
      
      // Criar blob e fazer download
      const blob = new Blob([response.data], {
        type: reportFormat === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = reportFormat === 'pdf' ? 'pdf' : 'xlsx';
      const scenario = scenarios.find(s => s.id === selectedScenarioForReport);
      const nomeArquivo = `relatorio_${scenario?.nome || 'cenario'}_${new Date().toISOString().split('T')[0]}.${extension}`;
      link.download = nomeArquivo;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowReportDialog(false);
      setSelectedScenarioForReport(null);
      alert('Relatório gerado e baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      alert(err.response?.data?.message || 'Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCloseReportDialog = () => {
    setShowReportDialog(false);
    setSelectedScenarioForReport(null);
    setReportFormat('pdf');
    setReportPeriod('todos');
  };

  const handleToggleFreeze = async (scenario, e) => {
    e.stopPropagation();
    try {
      await projectsAPI.updateScenario(scenario.id, {
        is_active: !scenario.is_active
      });
      await fetchScenarios(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao atualizar cenário:', error);
      alert('Erro ao atualizar cenário. Tente novamente.');
    }
  };

  const handleDeleteScenario = async (scenario, e) => {
    e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja excluir o cenário "${scenario.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await projectsAPI.deleteScenario(scenario.id);
      await fetchScenarios(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir cenário:', error);
      alert('Erro ao excluir cenário. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Cenários</h2>
            <p className="text-gray-600 mt-1">Gerencie cenários financeiros e compare diferentes projeções.</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Olá, {user?.nome || 'Usuário'}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <X className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{totalScenarios}</div>
              <div className="text-sm text-gray-600">Total de Cenários</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{activeScenarios}</div>
              <div className="text-sm text-gray-600">Cenários Ativos</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{frozenScenarios}</div>
              <div className="text-sm text-gray-600">Cenários Congelados</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{thisMonthScenarios}</div>
              <div className="text-sm text-gray-600">Criados este Mês</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showActive" 
                    checked={showActive}
                    onCheckedChange={setShowActive}
                  />
                  <label htmlFor="showActive" className="text-sm font-medium">
                    Apenas Ativos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="showFrozen" 
                    checked={showFrozen}
                    onCheckedChange={setShowFrozen}
                  />
                  <label htmlFor="showFrozen" className="text-sm font-medium">
                    Apenas Congelados
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleNewScenario}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cenário
                </Button>
                <Button variant="outline" onClick={handleCompare}>
                  <BarChart className="w-4 h-4 mr-2" />
                  Comparar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Mode */}
        {comparisonMode && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-6">
              <h5 className="text-lg font-semibold mb-4">Modo Comparação</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cenário 1</label>
                  <Select value={selectedScenario1} onValueChange={setSelectedScenario1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cenário" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={String(scenario.id)}>
                          {scenario.nome} - {scenario.projeto_nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cenário 2</label>
                  <Select value={selectedScenario2} onValueChange={setSelectedScenario2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cenário" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={String(scenario.id)}>
                          {scenario.nome} - {scenario.projeto_nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCompareScenarios}>
                  Comparar Cenários
                </Button>
                <Button variant="outline" size="sm" onClick={handleExitCompare}>
                  Sair do Modo Comparação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scenarios List */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Carregando cenários...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <p>{error}</p>
                <Button onClick={fetchScenarios} className="mt-4">
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredScenarios.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Nenhum cenário encontrado.</p>
              <p className="text-sm text-gray-500 mt-2">
                Faça upload de uma planilha para criar cenários automaticamente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredScenarios.map((scenario) => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  activeScenario === scenario.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200'
                }`}
                onClick={() => handleScenarioClick(scenario.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="text-lg font-semibold text-gray-900">{scenario.nome}</h5>
                      <p className="text-sm text-gray-500">{scenario.projeto_nome}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {scenario.arquivo_nome && `Arquivo: ${scenario.arquivo_nome}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        Criado em: {formatDate(scenario.created_at)}
                      </p>
                    </div>
                    <Badge 
                      variant={scenario.is_active ? 'default' : 'secondary'}
                      className={scenario.is_active ? 'bg-green-500' : 'bg-gray-500'}
                    >
                      {scenario.is_active ? 'Ativo' : 'Congelado'}
                    </Badge>
                  </div>

                  {scenario.descricao && (
                    <p className="text-sm text-gray-600 mb-4">{scenario.descricao}</p>
                  )}

                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={(e) => handleViewScenario(scenario.id, e)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!scenario.is_active}
                      onClick={(e) => handleEditScenario(scenario.id, e)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => handleGenerateReport(scenario.id, e)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Relatório
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => handleToggleFreeze(scenario, e)}
                    >
                      {scenario.is_active ? (
                        <>
                          <LockIcon className="w-4 h-4 mr-1" />
                          Congelar
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-1" />
                          Descongelar
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={(e) => handleDeleteScenario(scenario, e)}
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

        {/* Charts Row (shown in comparison mode) */}
        {comparisonMode && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap justify-between items-center">
                    <CardTitle>Comparação de Receitas</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-green-50 text-green-700">
                        Mensal
                      </Button>
                      <Button size="sm" variant="outline">
                        Trimestral
                      </Button>
                      <Button size="sm" variant="outline">
                        Anual
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Gráfico de Comparação
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Lucros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Gráfico de Distribuição
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Análise do Cenário */}
      <ScenarioAnalysisModal
        scenarioId={selectedScenarioForAnalysis}
        isOpen={analysisModalOpen}
        onClose={handleCloseAnalysisModal}
        onScenarioUpdated={handleScenarioUpdated}
      />

      {/* Modal de Comparação de Cenários */}
      <ScenarioComparisonModal
        scenarioIds={selectedScenariosForComparison}
        isOpen={comparisonModalOpen}
        onClose={handleCloseComparisonModal}
      />

      {/* Dialog de Geração de Relatório */}
      <Dialog open={showReportDialog} onOpenChange={handleCloseReportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Relatório</DialogTitle>
            <DialogDescription>
              Selecione o formato e período do relatório
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="report-format">Formato</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger id="report-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="report-period">Período</Label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger id="report-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Períodos</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReportDialog}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateReportSubmit} disabled={generatingReport}>
              {generatingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar e Baixar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scenarios;
