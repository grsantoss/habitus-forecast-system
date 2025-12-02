import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Lock, Unlock, Loader2, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, BarChart3, List, Plus, LineChart as LineChartIcon, Download, History, Pencil, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import AddLancamentoForm from './AddLancamentoForm';
import LancamentosTable from './LancamentosTable';
import ScenarioCharts from './ScenarioCharts';
import ScenarioHistory from './ScenarioHistory';

const ScenarioAnalysisModal = ({ scenarioId, isOpen, onClose, onScenarioUpdated }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [freezing, setFreezing] = useState(false);
  const [lancamentos, setLancamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('analise');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportPeriod, setReportPeriod] = useState('todos');
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Estados para edição de informações básicas
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editingNome, setEditingNome] = useState('');
  const [editingDescricao, setEditingDescricao] = useState('');
  const [editingProjetoNome, setEditingProjetoNome] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    if (isOpen && scenarioId) {
      fetchAnalysis();
      fetchLancamentos();
      fetchCategorias();
      setShowAddForm(false);
      setActiveTab('analise');
      setIsEditingInfo(false);
    }
  }, [isOpen, scenarioId]);

  // Inicializar valores quando analysis carregar
  useEffect(() => {
    if (analysis && !isEditingInfo) {
      setEditingNome(analysis.cenario.nome || '');
      setEditingDescricao(analysis.cenario.descricao || '');
      setEditingProjetoNome(analysis.projeto.nome_cliente || '');
    }
  }, [analysis, isEditingInfo]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectsAPI.getScenarioAnalysis(scenarioId);
      setAnalysis(response.data);
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
      setError('Erro ao carregar análise do cenário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLancamentos = async () => {
    try {
      const response = await projectsAPI.listLancamentos(scenarioId);
      setLancamentos(response.data.lancamentos || []);
    } catch (err) {
      console.error('Erro ao buscar lançamentos:', err);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await projectsAPI.listCategorias();
      setCategorias(response.data.categorias || []);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  };

  const handleLancamentoUpdated = async () => {
    // Recarregar lançamentos e análise
    await fetchLancamentos();
    await fetchAnalysis();
    setShowAddForm(false);
  };

  const handleGenerateReport = async () => {
    if (!scenarioId) return;

    try {
      setGeneratingReport(true);
      
      const response = await projectsAPI.downloadReport(scenarioId, reportFormat, reportPeriod);
      
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
      const nomeArquivo = `relatorio_${analysis?.cenario?.nome || 'cenario'}_${new Date().toISOString().split('T')[0]}.${extension}`;
      link.download = nomeArquivo;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowReportDialog(false);
      alert('Relatório gerado e baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      alert(err.response?.data?.message || 'Erro ao gerar relatório. Tente novamente.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!analysis || !scenarioId) return;

    // Validações
    if (!editingNome.trim()) {
      alert('O nome do cenário é obrigatório.');
      return;
    }
    if (!editingProjetoNome.trim()) {
      alert('O nome do projeto é obrigatório.');
      return;
    }

    try {
      setSavingInfo(true);
      
      // Atualizar cenário
      await projectsAPI.updateScenario(scenarioId, {
        nome: editingNome.trim(),
        descricao: editingDescricao.trim()
      });
      
      // Atualizar projeto
      await projectsAPI.update(analysis.projeto.id, {
        nome_cliente: editingProjetoNome.trim()
      });
      
      // Recarregar análise
      await fetchAnalysis();
      setIsEditingInfo(false);
      
      // Notificar componente pai
      if (onScenarioUpdated) {
        onScenarioUpdated();
      }
      
      alert('Informações atualizadas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar informações:', err);
      alert(err.response?.data?.message || 'Erro ao salvar informações. Tente novamente.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCancelEdit = () => {
    // Restaurar valores originais
    if (analysis) {
      setEditingNome(analysis.cenario.nome || '');
      setEditingDescricao(analysis.cenario.descricao || '');
      setEditingProjetoNome(analysis.projeto.nome_cliente || '');
    }
    setIsEditingInfo(false);
  };

  const handleToggleFreeze = async () => {
    if (!analysis) return;
    
    try {
      setFreezing(true);
      await projectsAPI.updateScenario(scenarioId, {
        is_active: !analysis.cenario.is_active
      });
      
      // Atualizar análise local
      setAnalysis(prev => ({
        ...prev,
        cenario: {
          ...prev.cenario,
          is_active: !prev.cenario.is_active
        }
      }));
      
      // Notificar componente pai
      if (onScenarioUpdated) {
        onScenarioUpdated();
      }
    } catch (err) {
      console.error('Erro ao atualizar cenário:', err);
      alert('Erro ao atualizar cenário. Tente novamente.');
    } finally {
      setFreezing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="inset-[1%] !w-auto !h-auto !max-w-none !max-h-none !sm:max-w-none !translate-x-0 !translate-y-0 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Análise do Cenário
          </DialogTitle>
          <DialogDescription>
            Detalhes e estatísticas do cenário financeiro
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && analysis && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analise">
                <BarChart3 className="w-4 h-4 mr-2" />
                Análise
              </TabsTrigger>
              <TabsTrigger value="graficos">
                <LineChartIcon className="w-4 h-4 mr-2" />
                Gráficos
              </TabsTrigger>
              <TabsTrigger value="lancamentos">
                <List className="w-4 h-4 mr-2" />
                Lançamentos
              </TabsTrigger>
              <TabsTrigger value="historico">
                <History className="w-4 h-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analise" className="space-y-4 mt-4">
              <div className="space-y-4">
            {/* Informações Básicas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
                {!isEditingInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingInfo(true)}
                    className="gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditingInfo ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome-cenario">Nome do Cenário *</Label>
                        <Input
                          id="nome-cenario"
                          value={editingNome}
                          onChange={(e) => setEditingNome(e.target.value)}
                          placeholder="Nome do Cenário"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nome-projeto">Nome do Projeto *</Label>
                        <Input
                          id="nome-projeto"
                          value={editingProjetoNome}
                          onChange={(e) => setEditingProjetoNome(e.target.value)}
                          placeholder="Nome do Projeto"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={editingDescricao}
                        onChange={(e) => setEditingDescricao(e.target.value)}
                        placeholder="Descrição do cenário"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSaveInfo}
                        disabled={savingInfo || !editingNome.trim() || !editingProjetoNome.trim()}
                        className="gap-2"
                      >
                        {savingInfo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Salvar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={savingInfo}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nome do Cenário</p>
                        <p className="font-semibold">{analysis.cenario.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge variant={analysis.cenario.is_active ? "default" : "secondary"}>
                          {analysis.cenario.is_active ? 'Ativo' : 'Congelado'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Projeto</p>
                        <p className="font-semibold">{analysis.projeto.nome_cliente}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Data Base</p>
                        <p className="font-semibold">{formatDate(analysis.projeto.data_base_estudo)}</p>
                      </div>
                      {analysis.arquivo.nome_original && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Arquivo Origem</p>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <p className="font-semibold">{analysis.arquivo.nome_original}</p>
                            {analysis.arquivo.uploaded_at && (
                              <span className="text-xs text-gray-500">
                                ({formatDate(analysis.arquivo.uploaded_at)})
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {(analysis.cenario.descricao || isEditingInfo) && (
                      <div>
                        <p className="text-sm text-gray-600">Descrição</p>
                        <p className="text-sm">{analysis.cenario.descricao || 'Sem descrição'}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas Financeiras */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Estatísticas Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-green-700 font-medium">Total Entradas</p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(analysis.estatisticas.total_entradas)}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-700 font-medium">Total Saídas</p>
                    </div>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(analysis.estatisticas.total_saidas)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    analysis.estatisticas.saldo_liquido >= 0 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className={`w-4 h-4 ${
                        analysis.estatisticas.saldo_liquido >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`} />
                      <p className={`text-sm font-medium ${
                        analysis.estatisticas.saldo_liquido >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>
                        Saldo Líquido
                      </p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      analysis.estatisticas.saldo_liquido >= 0 ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      {formatCurrency(analysis.estatisticas.saldo_liquido)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de Lançamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Estatísticas de Lançamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-800">
                      {analysis.estatisticas.total_lancamentos}
                    </p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {analysis.estatisticas.lancamentos_entrada}
                    </p>
                    <p className="text-xs text-gray-600">Entradas</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-700">
                      {analysis.estatisticas.lancamentos_saida}
                    </p>
                    <p className="text-xs text-gray-600">Saídas</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">
                      {analysis.estatisticas.lancamentos_projetados}
                    </p>
                    <p className="text-xs text-gray-600">Projetados</p>
                  </div>
                </div>
                {analysis.estatisticas.periodo_inicio && analysis.estatisticas.periodo_fim && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">Período de Análise</p>
                    <p className="font-semibold">
                      {formatDate(analysis.estatisticas.periodo_inicio)} - {formatDate(analysis.estatisticas.periodo_fim)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categorias */}
            {analysis.categorias && analysis.categorias.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analysis.categorias.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{cat.nome}</p>
                          <p className="text-xs text-gray-600">{cat.quantidade} lançamento(s)</p>
                        </div>
                        <p className="font-bold text-lg">
                          {formatCurrency(cat.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
              </div>
            </TabsContent>

            <TabsContent value="graficos" className="mt-4">
              <ScenarioCharts scenarioId={scenarioId} />
            </TabsContent>

            <TabsContent value="lancamentos" className="mt-4">
              <div className="space-y-4">
                {showAddForm ? (
                  <AddLancamentoForm
                    cenarioId={scenarioId}
                    cenarioAtivo={analysis.cenario.is_active}
                    onSuccess={handleLancamentoUpdated}
                    onCancel={() => setShowAddForm(false)}
                  />
                ) : (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowAddForm(true)}
                      disabled={!analysis.cenario.is_active}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Lançamento
                    </Button>
                  </div>
                )}

                {!analysis.cenario.is_active && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
                    Este cenário está congelado. Descongele-o para editar lançamentos.
                  </div>
                )}

                <LancamentosTable
                  lancamentos={lancamentos}
                  categorias={categorias}
                  cenarioId={scenarioId}
                  cenarioAtivo={analysis.cenario.is_active}
                  onUpdate={handleLancamentoUpdated}
                />
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <ScenarioHistory
                scenarioId={scenarioId}
                cenarioAtivo={analysis.cenario.is_active}
                onVersionRestored={handleLancamentoUpdated}
              />
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {analysis && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
              <Button
                onClick={handleToggleFreeze}
                disabled={freezing}
                variant={analysis.cenario.is_active ? "default" : "secondary"}
              >
                {freezing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : analysis.cenario.is_active ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Congelar Cenário
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Descongelar Cenário
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>

        {/* Dialog de Geração de Relatório */}
        {showReportDialog && (
          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
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
                <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerateReport} disabled={generatingReport}>
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioAnalysisModal;

