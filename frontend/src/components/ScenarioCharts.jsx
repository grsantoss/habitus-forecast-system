import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from './ui/badge';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const ScenarioCharts = ({ scenarioId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartsData, setChartsData] = useState(null);
  const [periodo, setPeriodo] = useState('mensal');
  const [activeChart, setActiveChart] = useState('fluxo_caixa');

  useEffect(() => {
    if (scenarioId) {
      fetchChartsData();
    }
  }, [scenarioId, periodo]);

  const fetchChartsData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await projectsAPI.getScenarioCharts(scenarioId, periodo);
      setChartsData(response.data);
    } catch (err) {
      console.error('Erro ao buscar dados dos gráficos:', err);
      setError('Erro ao carregar dados dos gráficos. Tente novamente.');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!chartsData) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado disponível para gráficos
      </div>
    );
  }

  const { fluxo_caixa, distribuicao_categorias, entradas_vs_saidas, tendencias } = chartsData;

  // Preparar dados para gráfico de pizza (top 8 categorias)
  const topCategorias = distribuicao_categorias.slice(0, 8).map(cat => ({
    name: cat.categoria,
    value: cat.total
  }));

  return (
    <div className="space-y-6">
      {/* Filtros e Tendências */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Label htmlFor="periodo" className="mr-2">Período:</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Card de Tendências */}
        {tendencias && tendencias.tendencia !== 'insuficientes_dados' && (
          <Card className="flex-1">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tendência</p>
                  <div className="flex items-center gap-2">
                    {tendencias.tendencia === 'crescente' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : tendencias.tendencia === 'decrescente' ? (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-600" />
                    )}
                    <Badge
                      className={
                        tendencias.tendencia === 'crescente' ? 'bg-green-600' :
                        tendencias.tendencia === 'decrescente' ? 'bg-red-600' : 'bg-gray-600'
                      }
                    >
                      {tendencias.tendencia === 'crescente' ? 'Crescente' :
                       tendencias.tendencia === 'decrescente' ? 'Decrescente' : 'Estável'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Variação</p>
                  <p className={`font-semibold ${
                    tendencias.variacao_saldo >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(tendencias.variacao_saldo)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Projeção Próximo Período</p>
                  <p className={`font-semibold ${
                    tendencias.projecao_saldo >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(tendencias.projecao_saldo)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs para alternar entre gráficos */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveChart('fluxo_caixa')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeChart === 'fluxo_caixa'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Fluxo de Caixa
        </button>
        <button
          onClick={() => setActiveChart('entradas_vs_saidas')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeChart === 'entradas_vs_saidas'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Entradas vs Saídas
        </button>
        <button
          onClick={() => setActiveChart('distribuicao')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeChart === 'distribuicao'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Distribuição por Categoria
        </button>
      </div>

      {/* Gráfico de Linha - Fluxo de Caixa */}
      {activeChart === 'fluxo_caixa' && (
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {fluxo_caixa && fluxo_caixa.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={fluxo_caixa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="entradas"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Entradas"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="saidas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Saídas"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo_liquido"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Saldo Líquido"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum dado disponível para o gráfico
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Barras - Entradas vs Saídas */}
      {activeChart === 'entradas_vs_saidas' && (
        <Card>
          <CardHeader>
            <CardTitle>Comparação Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            {entradas_vs_saidas && entradas_vs_saidas.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={entradas_vs_saidas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                  <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum dado disponível para o gráfico
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Pizza - Distribuição por Categoria */}
      {activeChart === 'distribuicao' && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria (Top 8)</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategorias && topCategorias.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-8">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={topCategorias}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topCategorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1">
                  <div className="space-y-2">
                    {distribuicao_categorias.slice(0, 8).map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{cat.categoria}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhum dado disponível para o gráfico
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScenarioCharts;

