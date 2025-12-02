import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Loader2, TrendingUp, TrendingDown, Download } from 'lucide-react';

const ScenarioComparisonModal = ({ scenarioIds, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    if (isOpen && scenarioIds && scenarioIds.length >= 2) {
      fetchComparison();
    }
  }, [isOpen, scenarioIds]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectsAPI.compareScenarios(scenarioIds);
      setComparisonData(response.data);
    } catch (err) {
      console.error('Erro ao buscar comparação:', err);
      setError(err.response?.data?.message || 'Erro ao carregar comparação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Preparar dados para gráfico comparativo
  const prepareChartData = () => {
    if (!comparisonData || !comparisonData.comparacao) return [];

    // Obter todos os períodos únicos
    const allPeriods = new Set();
    comparisonData.comparacao.forEach(cenario => {
      if (cenario.fluxo_caixa) {
        cenario.fluxo_caixa.forEach(item => {
          allPeriods.add(item.periodo);
        });
      }
    });

    const periods = Array.from(allPeriods).sort();

    // Criar estrutura de dados para cada período
    return periods.map(periodo => {
      const dataPoint = { periodo };
      comparisonData.comparacao.forEach((cenario, index) => {
        const fluxoItem = cenario.fluxo_caixa?.find(item => item.periodo === periodo);
        if (fluxoItem) {
          dataPoint[`${cenario.cenario_nome} - Saldo`] = fluxoItem.saldo_liquido;
          dataPoint[`${cenario.cenario_nome} - Entradas`] = fluxoItem.entradas;
          dataPoint[`${cenario.cenario_nome} - Saídas`] = fluxoItem.saidas;
        } else {
          dataPoint[`${cenario.cenario_nome} - Saldo`] = 0;
          dataPoint[`${cenario.cenario_nome} - Entradas`] = 0;
          dataPoint[`${cenario.cenario_nome} - Saídas`] = 0;
        }
      });
      return dataPoint;
    });
  };

  const chartData = prepareChartData();
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleExport = (format) => {
    // Implementação básica de exportação
    if (format === 'csv') {
      let csv = 'Cenário,Total Entradas,Total Saídas,Saldo Líquido,Diferença % Entradas,Diferença % Saídas,Diferença % Saldo\n';
      
      comparisonData.comparacao.forEach(cenario => {
        const stats = cenario.estatisticas;
        const diffs = cenario.diferencas_percentuais || { entradas: 0, saidas: 0, saldo_liquido: 0 };
        csv += `"${cenario.cenario_nome}",${stats.total_entradas},${stats.total_saidas},${stats.saldo_liquido},${diffs.entradas},${diffs.saidas},${diffs.saldo_liquido}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `comparacao_cenarios_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comparação de Cenários
          </DialogTitle>
          <DialogDescription>
            Análise comparativa entre múltiplos cenários financeiros
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && comparisonData && (
          <div className="space-y-6">
            {/* Botão de Exportação */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {/* Tabela Comparativa */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Comparativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cenário</TableHead>
                        <TableHead className="text-right">Total Entradas</TableHead>
                        <TableHead className="text-right">Total Saídas</TableHead>
                        <TableHead className="text-right">Saldo Líquido</TableHead>
                        <TableHead className="text-right">Dif. % Entradas</TableHead>
                        <TableHead className="text-right">Dif. % Saídas</TableHead>
                        <TableHead className="text-right">Dif. % Saldo</TableHead>
                        <TableHead>Lançamentos</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.comparacao.map((cenario, index) => {
                        const stats = cenario.estatisticas;
                        const diffs = cenario.diferencas_percentuais || {
                          entradas: 0,
                          saidas: 0,
                          saldo_liquido: 0
                        };
                        const isBase = index === 0;

                        return (
                          <TableRow key={cenario.cenario_id}>
                            <TableCell className="font-medium">
                              <div>
                                <p>{cenario.cenario_nome}</p>
                                <p className="text-xs text-gray-500">{cenario.projeto_nome}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-700">
                              {formatCurrency(stats.total_entradas)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-700">
                              {formatCurrency(stats.total_saidas)}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${
                              stats.saldo_liquido >= 0 ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {formatCurrency(stats.saldo_liquido)}
                            </TableCell>
                            <TableCell className="text-right">
                              {isBase ? (
                                <span className="text-gray-500">—</span>
                              ) : (
                                <span className={`flex items-center justify-end gap-1 ${
                                  diffs.entradas >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {diffs.entradas >= 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4" />
                                  )}
                                  {formatPercent(diffs.entradas)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isBase ? (
                                <span className="text-gray-500">—</span>
                              ) : (
                                <span className={`flex items-center justify-end gap-1 ${
                                  diffs.saidas >= 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {diffs.saidas >= 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4" />
                                  )}
                                  {formatPercent(diffs.saidas)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isBase ? (
                                <span className="text-gray-500">—</span>
                              ) : (
                                <span className={`flex items-center justify-end gap-1 ${
                                  diffs.saldo_liquido >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {diffs.saldo_liquido >= 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4" />
                                  )}
                                  {formatPercent(diffs.saldo_liquido)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{stats.total_lancamentos}</TableCell>
                            <TableCell>
                              <Badge className={cenario.is_active ? 'bg-green-600' : 'bg-gray-600'}>
                                {cenario.is_active ? 'Ativo' : 'Congelado'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico Comparativo */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Caixa Comparativo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {comparisonData.comparacao.map((cenario, index) => (
                        <Line
                          key={`${cenario.cenario_id}-saldo`}
                          type="monotone"
                          dataKey={`${cenario.cenario_nome} - Saldo`}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          name={`${cenario.cenario_nome} (Saldo)`}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Entradas vs Saídas Comparativo */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Entradas Comparativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {comparisonData.comparacao.map((cenario, index) => (
                        <Line
                          key={`${cenario.cenario_id}-entradas`}
                          type="monotone"
                          dataKey={`${cenario.cenario_nome} - Entradas`}
                          stroke={colors[index % colors.length]}
                          strokeWidth={2}
                          name={`${cenario.cenario_nome} (Entradas)`}
                          dot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioComparisonModal;

