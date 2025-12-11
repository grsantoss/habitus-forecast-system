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
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Brush,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, TrendingUp, TrendingDown, Download, Award, BarChart3, Target, AlertCircle, TrendingUp as TrendingUpIcon, Activity, DollarSign, Percent, Network, FileText, FileSpreadsheet, Image, LayoutGrid, LayoutList, Lightbulb } from 'lucide-react';

const ScenarioComparisonModal = ({ scenarioIds, isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [periodoFiltro, setPeriodoFiltro] = useState('todos');
  const [viewMode, setViewMode] = useState('detalhado'); // 'compacto' | 'detalhado'
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isOpen && scenarioIds && scenarioIds.length >= 2) {
      fetchComparison();
    } else if (!isOpen) {
      // Limpar dados quando o modal fechar
      setComparisonData(null);
      setError('');
      setLoading(true);
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

  // Filtrar dados por período
  const filtrarPorPeriodo = (dados) => {
    if (!dados || periodoFiltro === 'todos' || dados.length === 0) return dados;
    
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    
    return dados.filter(item => {
      if (!item.periodo) return false;
      
      // Parsear período (formato: "Jan/2024")
      const partes = item.periodo.split('/');
      if (partes.length !== 2) return false;
      
      const [mesStr, anoStr] = partes;
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesIndex = meses.indexOf(mesStr);
      const ano = parseInt(anoStr);
      
      if (mesIndex === -1 || isNaN(ano)) return false;
      
      // Calcular meses desde o período até agora
      const mesesAtras = (anoAtual - ano) * 12 + (mesAtual - mesIndex);
      
      switch (periodoFiltro) {
        case 'ultimos_3':
          return mesesAtras >= 0 && mesesAtras <= 3;
        case 'ultimos_6':
          return mesesAtras >= 0 && mesesAtras <= 6;
        case 'ultimos_12':
          return mesesAtras >= 0 && mesesAtras <= 12;
        case 'trimestre_atual':
          const trimestreAtual = Math.floor(mesAtual / 3);
          const trimestreItem = Math.floor(mesIndex / 3);
          return ano === anoAtual && trimestreItem === trimestreAtual;
        case 'ano_atual':
          return ano === anoAtual;
        default:
          return true;
      }
    });
  };

  const chartData = filtrarPorPeriodo(prepareChartData());
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Calcular métricas financeiras adicionais
  const calcularMetricasFinanceiras = (cenario) => {
    const stats = cenario.estatisticas;
    
    // Margem de Lucro (%)
    const margemLucro = stats.total_entradas > 0 
      ? ((stats.saldo_liquido / stats.total_entradas) * 100).toFixed(2)
      : '0.00';
    
    // Ticket Médio
    const ticketMedio = stats.total_lancamentos > 0
      ? stats.total_entradas / stats.total_lancamentos
      : 0;
    
    // Razão Entradas/Saídas
    const razaoES = stats.total_saidas > 0
      ? (stats.total_entradas / stats.total_saidas).toFixed(2)
      : '0.00';
    
    // Crescimento Médio Mensal
    let crescimentoMedio = 0;
    if (cenario.fluxo_caixa && cenario.fluxo_caixa.length > 1) {
      const saldos = cenario.fluxo_caixa.map(item => item.saldo_liquido);
      const variacoes = [];
      for (let i = 1; i < saldos.length; i++) {
        if (saldos[i-1] !== 0) {
          variacoes.push(((saldos[i] - saldos[i-1]) / Math.abs(saldos[i-1])) * 100);
        }
      }
      if (variacoes.length > 0) {
        crescimentoMedio = variacoes.reduce((sum, v) => sum + v, 0) / variacoes.length;
      }
    }
    
    return {
      margemLucro: parseFloat(margemLucro),
      ticketMedio,
      razaoES: parseFloat(razaoES),
      crescimentoMedio: crescimentoMedio.toFixed(2)
    };
  };

  // Calcular indicadores de tendência
  const calcularTendencia = (cenario) => {
    if (!cenario.fluxo_caixa || cenario.fluxo_caixa.length < 2) {
      return {
        tipo: 'insuficientes_dados',
        descricao: 'Dados insuficientes',
        variacao_percentual: 0,
        direcao: 'estavel'
      };
    }
    
    const saldos = cenario.fluxo_caixa.map(item => item.saldo_liquido);
    const primeiro = saldos[0];
    const ultimo = saldos[saldos.length - 1];
    
    let variacao = 0;
    let variacaoPercentual = 0;
    
    if (primeiro !== 0) {
      variacao = ultimo - primeiro;
      variacaoPercentual = (variacao / Math.abs(primeiro)) * 100;
    } else {
      variacao = ultimo;
      variacaoPercentual = ultimo > 0 ? 100 : (ultimo < 0 ? -100 : 0);
    }
    
    let tipo = 'estavel';
    let descricao = 'Estável';
    let direcao = 'estavel';
    
    if (variacaoPercentual > 10) {
      tipo = 'positiva';
      descricao = 'Crescimento Forte';
      direcao = 'crescente';
    } else if (variacaoPercentual > 5) {
      tipo = 'positiva';
      descricao = 'Crescimento Moderado';
      direcao = 'crescente';
    } else if (variacaoPercentual > 0) {
      tipo = 'positiva';
      descricao = 'Crescimento Leve';
      direcao = 'crescente';
    } else if (variacaoPercentual < -10) {
      tipo = 'negativa';
      descricao = 'Declínio Acentuado';
      direcao = 'decrescente';
    } else if (variacaoPercentual < -5) {
      tipo = 'negativa';
      descricao = 'Declínio Moderado';
      direcao = 'decrescente';
    } else if (variacaoPercentual < 0) {
      tipo = 'negativa';
      descricao = 'Declínio Leve';
      direcao = 'decrescente';
    }
    
    return {
      tipo,
      descricao,
      variacao,
      variacao_percentual: variacaoPercentual.toFixed(2),
      direcao
    };
  };

  // Calcular análise de variância
  const calcularVariabilidade = (cenario) => {
    if (!cenario.fluxo_caixa || cenario.fluxo_caixa.length < 2) {
      return {
        desvio_padrao: 0,
        coeficiente_variacao: 0,
        estabilidade: 'indeterminado'
      };
    }
    
    const saldos = cenario.fluxo_caixa.map(item => item.saldo_liquido);
    
    // Média
    const media = saldos.reduce((sum, val) => sum + val, 0) / saldos.length;
    
    // Variância
    const variancia = saldos.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / saldos.length;
    
    // Desvio padrão
    const desvioPadrao = Math.sqrt(variancia);
    
    // Coeficiente de variação
    const coeficienteVariacao = media !== 0 ? (desvioPadrao / Math.abs(media)) : 0;
    
    let estabilidade = 'variável';
    if (coeficienteVariacao < 0.1) estabilidade = 'muito_estavel';
    else if (coeficienteVariacao < 0.2) estabilidade = 'estavel';
    else if (coeficienteVariacao < 0.4) estabilidade = 'moderadamente_variavel';
    
    return {
      desvio_padrao: desvioPadrao,
      coeficiente_variacao: coeficienteVariacao.toFixed(3),
      estabilidade
    };
  };

  // Calcular KPIs comparativos
  const calcularKPIs = (cenario) => {
    const stats = cenario.estatisticas;
    const metricas = calcularMetricasFinanceiras(cenario);
    
    // Margem Bruta (%)
    const margemBruta = metricas.margemLucro;
    
    // ROI (simplificado - assumindo investimento inicial como primeira saída)
    let roi = 0;
    if (cenario.fluxo_caixa && cenario.fluxo_caixa.length > 0) {
      const primeiraSaida = cenario.fluxo_caixa[0]?.saidas || stats.total_saidas / cenario.fluxo_caixa.length;
      if (primeiraSaida > 0) {
        roi = ((stats.saldo_liquido / primeiraSaida) * 100).toFixed(2);
      }
    }
    
    // Payback (simplificado - meses para recuperar investimento inicial)
    let payback = 'N/A';
    if (cenario.fluxo_caixa && cenario.fluxo_caixa.length > 0) {
      const primeiraSaida = cenario.fluxo_caixa[0]?.saidas || 0;
      if (primeiraSaida > 0 && stats.saldo_liquido > 0) {
        const saldoMedioMensal = stats.saldo_liquido / cenario.fluxo_caixa.length;
        if (saldoMedioMensal > 0) {
          const meses = Math.ceil(primeiraSaida / saldoMedioMensal);
          payback = `${meses} meses`;
        }
      }
    }
    
    // Crescimento (%)
    const crescimento = parseFloat(calcularTendencia(cenario).variacao_percentual);
    
    return {
      margemBruta,
      roi: parseFloat(roi),
      payback,
      crescimento
    };
  };

  // Função auxiliar para normalizar
  const normalizar = (valor, min, max) => {
    if (max === min) return 50;
    return Math.max(0, Math.min(100, ((valor - min) / (max - min)) * 100));
  };

  // Preparar dados para gráfico radar
  const prepareRadarData = () => {
    if (!comparisonData || !comparisonData.comparacao) return [];

    // Normalizar métricas para escala 0-100
    const metricas = comparisonData.comparacao.map(cenario => {
      const stats = cenario.estatisticas;
      const metricasFin = calcularMetricasFinanceiras(cenario);
      const kpis = calcularKPIs(cenario);

      return {
        cenario_id: cenario.cenario_id,
        cenario_nome: cenario.cenario_nome,
        saldoLiquido: stats.saldo_liquido,
        margemLucro: metricasFin.margemLucro,
        ticketMedio: metricasFin.ticketMedio,
        razaoES: metricasFin.razaoES,
        crescimento: parseFloat(metricasFin.crescimentoMedio),
        roi: kpis.roi
      };
    });

    // Encontrar min/max para normalização
    const saldos = metricas.map(m => m.saldoLiquido);
    const margens = metricas.map(m => m.margemLucro);
    const tickets = metricas.map(m => m.ticketMedio);
    const razoes = metricas.map(m => m.razaoES);
    const crescimentos = metricas.map(m => m.crescimento);
    const rois = metricas.map(m => m.roi);

    const minMax = {
      saldoLiquido: { min: Math.min(...saldos), max: Math.max(...saldos) },
      margemLucro: { min: Math.min(...margens), max: Math.max(...margens) },
      ticketMedio: { min: Math.min(...tickets), max: Math.max(...tickets) },
      razaoES: { min: Math.min(...razoes), max: Math.max(...razoes) },
      crescimento: { min: Math.min(...crescimentos), max: Math.max(...crescimentos) },
      roi: { min: Math.min(...rois), max: Math.max(...rois) }
    };

    // Criar estrutura de dados para o radar chart
    const radarData = [
      { metric: 'Saldo Líquido', fullMark: 100 },
      { metric: 'Margem Lucro', fullMark: 100 },
      { metric: 'Ticket Médio', fullMark: 100 },
      { metric: 'Razão E/S', fullMark: 100 },
      { metric: 'Crescimento', fullMark: 100 },
      { metric: 'ROI', fullMark: 100 }
    ];

    // Adicionar dados de cada cenário
    metricas.forEach((metrica) => {
      radarData.forEach(item => {
        let valor = 0;
        switch (item.metric) {
          case 'Saldo Líquido':
            valor = normalizar(metrica.saldoLiquido, minMax.saldoLiquido.min, minMax.saldoLiquido.max);
            break;
          case 'Margem Lucro':
            valor = normalizar(metrica.margemLucro, minMax.margemLucro.min, minMax.margemLucro.max);
            break;
          case 'Ticket Médio':
            valor = normalizar(metrica.ticketMedio, minMax.ticketMedio.min, minMax.ticketMedio.max);
            break;
          case 'Razão E/S':
            valor = normalizar(metrica.razaoES, minMax.razaoES.min, minMax.razaoES.max);
            break;
          case 'Crescimento':
            valor = normalizar(metrica.crescimento, minMax.crescimento.min, minMax.crescimento.max);
            break;
          case 'ROI':
            valor = normalizar(metrica.roi, minMax.roi.min, minMax.roi.max);
            break;
        }
        item[`cenario_${metrica.cenario_id}`] = valor;
      });
    });

    return radarData;
  };

  // Calcular correlação entre cenários
  const calcularCorrelacao = (cenario1, cenario2) => {
    if (!cenario1.fluxo_caixa || !cenario2.fluxo_caixa) return 0;
    
    const fluxo1 = cenario1.fluxo_caixa.map(item => item.saldo_liquido);
    const fluxo2 = cenario2.fluxo_caixa.map(item => {
      const item2 = cenario2.fluxo_caixa.find(f => f.periodo === item.periodo);
      return item2 ? item2.saldo_liquido : 0;
    });

    if (fluxo1.length !== fluxo2.length || fluxo1.length < 2) return 0;

    // Calcular média
    const media1 = fluxo1.reduce((sum, val) => sum + val, 0) / fluxo1.length;
    const media2 = fluxo2.reduce((sum, val) => sum + val, 0) / fluxo2.length;

    // Calcular covariância e variâncias
    let covariancia = 0;
    let variancia1 = 0;
    let variancia2 = 0;

    for (let i = 0; i < fluxo1.length; i++) {
      const diff1 = fluxo1[i] - media1;
      const diff2 = fluxo2[i] - media2;
      covariancia += diff1 * diff2;
      variancia1 += diff1 * diff1;
      variancia2 += diff2 * diff2;
    }

    const desvio1 = Math.sqrt(variancia1);
    const desvio2 = Math.sqrt(variancia2);

    if (desvio1 === 0 || desvio2 === 0) return 0;

    // Coeficiente de correlação de Pearson
    const correlacao = covariancia / (desvio1 * desvio2);
    return Math.max(-1, Math.min(1, correlacao)); // Garantir entre -1 e 1
  };

  // Calcular resumo executivo
  const calcularResumoExecutivo = () => {
    if (!comparisonData || !comparisonData.comparacao) return null;

    const cenarios = comparisonData.comparacao;
    
    // Melhor saldo líquido
    const melhorCenario = cenarios.reduce((best, curr) => 
      curr.estatisticas.saldo_liquido > best.estatisticas.saldo_liquido ? curr : best
    );

    // Maior variação percentual (em valor absoluto)
    const maiorVariacao = cenarios
      .filter((_, i) => i > 0)
      .reduce((max, curr) => {
        const variacao = Math.abs(curr.diferencas_percentuais?.saldo_liquido || 0);
        return variacao > max.variacao ? { variacao, cenario: curr } : max;
      }, { variacao: 0, cenario: null });

    // Média de lançamentos
    const mediaLancamentos = Math.round(
      cenarios.reduce((sum, c) => sum + c.estatisticas.total_lancamentos, 0) / cenarios.length
    );

    return {
      melhorCenario,
      maiorVariacao,
      mediaLancamentos
    };
  };

  // Calcular ranking de performance
  const calcularRanking = () => {
    if (!comparisonData || !comparisonData.comparacao) return [];

    return comparisonData.comparacao
      .map(cenario => {
        const stats = cenario.estatisticas;
        const diffs = cenario.diferencas_percentuais || { entradas: 0, saidas: 0, saldo_liquido: 0 };
        
        // Score composto: saldo líquido (peso 50%) + margem (peso 30%) + crescimento (peso 20%)
        const margem = stats.total_entradas > 0 
          ? (stats.saldo_liquido / stats.total_entradas) * 100 
          : 0;
        
        const crescimento = Math.abs(diffs.saldo_liquido);
        
        // Normalizar valores para score 0-100
        const saldoNormalizado = Math.max(0, Math.min(100, (stats.saldo_liquido / 1000000) * 10));
        const margemNormalizada = Math.max(0, Math.min(100, margem));
        const crescimentoNormalizado = Math.max(0, Math.min(100, crescimento));
        
        const score = (saldoNormalizado * 0.5) + (margemNormalizada * 0.3) + (crescimentoNormalizado * 0.2);
        
        let classificacao = 'Regular';
        if (score >= 70) classificacao = 'Excelente';
        else if (score >= 50) classificacao = 'Bom';
        else if (score >= 30) classificacao = 'Médio';
        
        return {
          ...cenario,
          score: score.toFixed(2),
          margem: margem.toFixed(2),
          classificacao
        };
      })
      .sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
  };

  // Destacar diferenças significativas
  const destacarDiferenca = (valor, base, tipo) => {
    if (!base || base === 0) return '';
    const percentual = ((valor - base) / base) * 100;
    const percentualAbs = Math.abs(percentual);
    
    if (tipo === 'saldo') {
      // Diferença positiva significativa (verde)
      if (percentual > 15) return 'bg-green-100 border-green-300 border-2';
      if (percentual > 10) return 'bg-green-50 border-green-200';
      // Diferença negativa significativa (vermelho)
      if (percentual < -15) return 'bg-red-100 border-red-300 border-2';
      if (percentual < -10) return 'bg-red-50 border-red-200';
    }
    
    return '';
  };

  const resumoExecutivo = calcularResumoExecutivo();
  const ranking = calcularRanking();

  // Gerar insights automáticos
  const gerarInsights = () => {
    if (!comparisonData || !comparisonData.comparacao) return [];

    const insights = [];
    const cenarios = comparisonData.comparacao;

    // Insight 1: Melhor performance
    const melhorCenario = cenarios.reduce((best, curr) => 
      curr.estatisticas.saldo_liquido > best.estatisticas.saldo_liquido ? curr : best
    );
    const piorCenario = cenarios.reduce((worst, curr) => 
      curr.estatisticas.saldo_liquido < worst.estatisticas.saldo_liquido ? curr : worst
    );
    
    if (melhorCenario.cenario_id !== piorCenario.cenario_id) {
      const diferenca = melhorCenario.estatisticas.saldo_liquido - piorCenario.estatisticas.saldo_liquido;
      insights.push({
        tipo: 'positivo',
        titulo: 'Melhor Performance Identificada',
        descricao: `${melhorCenario.cenario_nome} apresenta o melhor saldo líquido (${formatCurrency(melhorCenario.estatisticas.saldo_liquido)}), superando ${piorCenario.cenario_nome} em ${formatCurrency(diferenca)}.`
      });
    }

    // Insight 2: Maior margem
    const cenariosComMargem = cenarios.map(c => ({
      ...c,
      margem: calcularMetricasFinanceiras(c).margemLucro
    }));
    const maiorMargem = cenariosComMargem.reduce((best, curr) => 
      curr.margem > best.margem ? curr : best
    );
    
    if (maiorMargem.margem > 20) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Alta Rentabilidade',
        descricao: `${maiorMargem.cenario_nome} possui a maior margem de lucro (${maiorMargem.margem.toFixed(2)}%), indicando alta eficiência operacional.`
      });
    }

    // Insight 3: Maior crescimento
    const cenariosComCrescimento = cenarios.map(c => ({
      ...c,
      crescimento: parseFloat(calcularTendencia(c).variacao_percentual)
    }));
    const maiorCrescimento = cenariosComCrescimento.reduce((best, curr) => 
      curr.crescimento > best.crescimento ? curr : best
    );
    
    if (maiorCrescimento.crescimento > 10) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Crescimento Acelerado',
        descricao: `${maiorCrescimento.cenario_nome} apresenta crescimento de ${maiorCrescimento.crescimento.toFixed(2)}%, demonstrando tendência positiva forte.`
      });
    }

    // Insight 4: Alta correlação
    if (cenarios.length >= 2) {
      let maiorCorrelacao = { cenario1: null, cenario2: null, valor: 0 };
      for (let i = 0; i < cenarios.length; i++) {
        for (let j = i + 1; j < cenarios.length; j++) {
          const corr = calcularCorrelacao(cenarios[i], cenarios[j]);
          if (corr > maiorCorrelacao.valor) {
            maiorCorrelacao = {
              cenario1: cenarios[i],
              cenario2: cenarios[j],
              valor: corr
            };
          }
        }
      }
      
      if (maiorCorrelacao.valor > 0.8) {
        insights.push({
          tipo: 'positivo',
          titulo: 'Alta Correlação entre Cenários',
          descricao: `${maiorCorrelacao.cenario1.cenario_nome} e ${maiorCorrelacao.cenario2.cenario_nome} apresentam alta correlação (${maiorCorrelacao.valor.toFixed(3)}), indicando comportamento similar.`
        });
      }
    }

    // Insight 5: Alertas de risco
    cenarios.forEach(cenario => {
      const metricas = calcularMetricasFinanceiras(cenario);
      const variabilidade = calcularVariabilidade(cenario);
      
      if (metricas.margemLucro < 0) {
        insights.push({
          tipo: 'negativo',
          titulo: 'Margem Negativa Detectada',
          descricao: `${cenario.cenario_nome} apresenta margem negativa (${metricas.margemLucro.toFixed(2)}%), indicando que as saídas superam as entradas.`
        });
      }
      
      if (parseFloat(variabilidade.coeficiente_variacao) > 0.4) {
        insights.push({
          tipo: 'negativo',
          titulo: 'Alta Variabilidade',
          descricao: `${cenario.cenario_nome} apresenta alta variabilidade (coef. ${variabilidade.coeficiente_variacao}), indicando instabilidade nos resultados.`
        });
      }
      
      if (metricas.razaoES < 1.0) {
        insights.push({
          tipo: 'negativo',
          titulo: 'Razão Entradas/Saídas Baixa',
          descricao: `${cenario.cenario_nome} possui razão E/S de ${metricas.razaoES.toFixed(2)}x, indicando que as saídas são maiores que as entradas.`
        });
      }
    });

    // Insight 6: Oportunidades
    const cenariosComTicket = cenarios.map(c => ({
      ...c,
      ticketMedio: calcularMetricasFinanceiras(c).ticketMedio
    }));
    const maiorTicket = cenariosComTicket.reduce((best, curr) => 
      curr.ticketMedio > best.ticketMedio ? curr : best
    );
    
    if (maiorTicket.ticketMedio > 0) {
      insights.push({
        tipo: 'positivo',
        titulo: 'Oportunidade de Otimização',
        descricao: `${maiorTicket.cenario_nome} apresenta o maior ticket médio (${formatCurrency(maiorTicket.ticketMedio)}). Considere aplicar estratégias similares aos outros cenários.`
      });
    }

    return insights.slice(0, 8); // Limitar a 8 insights
  };

  const handleExport = async (format) => {
    if (!comparisonData) return;

    setExporting(true);
    
    try {
      if (format === 'csv') {
        let csv = 'Cenário,Total Entradas,Total Saídas,Saldo Líquido,Margem (%),Ticket Médio,Razão E/S,Crescimento Médio (%),Diferença % Entradas,Diferença % Saídas,Diferença % Saldo\n';
        
        comparisonData.comparacao.forEach(cenario => {
          const stats = cenario.estatisticas;
          const diffs = cenario.diferencas_percentuais || { entradas: 0, saidas: 0, saldo_liquido: 0 };
          const metricas = calcularMetricasFinanceiras(cenario);
          csv += `"${cenario.cenario_nome}",${stats.total_entradas},${stats.total_saidas},${stats.saldo_liquido},${metricas.margemLucro},${metricas.ticketMedio},${metricas.razaoES},${metricas.crescimentoMedio},${diffs.entradas},${diffs.saidas},${diffs.saldo_liquido}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `comparacao_cenarios_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else if (format === 'pdf' || format === 'excel') {
        // Usar API do backend para PDF e Excel
        const response = await projectsAPI.downloadComparisonReport(
          scenarioIds,
          format,
          periodoFiltro
        );
        
        const blob = new Blob([response.data], {
          type: format === 'pdf' 
            ? 'application/pdf' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const extension = format === 'pdf' ? 'pdf' : 'xlsx';
        const nomeArquivo = `comparacao_cenarios_${new Date().toISOString().split('T')[0]}.${extension}`;
        link.download = nomeArquivo;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (format === 'png') {
        // Exportar gráficos como PNG (requer html2canvas ou similar)
        // Por enquanto, vamos usar uma abordagem simples capturando o conteúdo principal
        alert('Exportação PNG em desenvolvimento. Use PDF ou Excel para exportar gráficos.');
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar arquivo. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!w-[90vw] !h-[90vh] !max-w-none !max-h-none !sm:max-w-none !m-0 !rounded-lg p-0 !flex !flex-col !z-[60] !gap-0 !grid-none overflow-hidden"
      >
        <DialogHeader className="sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b shadow-sm flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Comparação de Cenários
          </DialogTitle>
          <DialogDescription>
            Análise comparativa entre múltiplos cenários financeiros
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
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
              {/* Controles de Visualização e Exportação */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Toggle Modo Compacto/Detalhado */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Visualização:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'compacto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('compacto')}
                    >
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      Compacto
                    </Button>
                    <Button
                      variant={viewMode === 'detalhado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('detalhado')}
                    >
                      <LayoutList className="w-4 h-4 mr-2" />
                      Detalhado
                    </Button>
                  </div>
                </div>

                {/* Menu de Exportação Expandido */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={exporting}>
                      {exporting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Exportar
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      CSV (Dados)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF (Relatório Completo)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel (Com Gráficos)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('png')}>
                      <Image className="w-4 h-4 mr-2" />
                      PNG (Gráficos)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Insights Automáticos */}
              {gerarInsights().length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      Insights Automáticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {gerarInsights().map((insight, index) => (
                        <div 
                          key={index} 
                          className={`flex items-start gap-3 p-3 rounded-lg ${
                            insight.tipo === 'positivo' 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <AlertCircle 
                            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                              insight.tipo === 'positivo' ? 'text-green-600' : 'text-red-600'
                            }`} 
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                              {insight.titulo}
                            </p>
                            <p className="text-xs text-gray-700">
                              {insight.descricao}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resumo Executivo */}
              {resumoExecutivo && (
                <Card className="bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Resumo Executivo da Comparação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Melhor Cenário */}
                      <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-semibold text-gray-700">Melhor Saldo Líquido</p>
                        </div>
                        <p className="text-lg font-bold text-green-700 truncate">
                          {resumoExecutivo.melhorCenario.cenario_nome}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {resumoExecutivo.melhorCenario.projeto_nome}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                          {formatCurrency(resumoExecutivo.melhorCenario.estatisticas.saldo_liquido)}
                        </p>
                      </div>
                      
                      {/* Maior Variação */}
                      <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-semibold text-gray-700">Maior Variação</p>
                        </div>
                        {resumoExecutivo.maiorVariacao.cenario ? (
                          <>
                            <p className="text-lg font-bold text-blue-700 truncate">
                              {resumoExecutivo.maiorVariacao.cenario.cenario_nome}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {resumoExecutivo.maiorVariacao.cenario.projeto_nome}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 mt-2">
                              {formatPercent(resumoExecutivo.maiorVariacao.variacao)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">N/A</p>
                        )}
                      </div>
                      
                      {/* Média de Lançamentos */}
                      <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          <p className="text-sm font-semibold text-gray-700">Média de Lançamentos</p>
                        </div>
                        <p className="text-3xl font-bold text-purple-700">
                          {resumoExecutivo.mediaLancamentos}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Por cenário</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filtros de Período */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filtrar Período:</label>
                  <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Períodos</SelectItem>
                      <SelectItem value="ultimos_3">Últimos 3 Meses</SelectItem>
                      <SelectItem value="ultimos_6">Últimos 6 Meses</SelectItem>
                      <SelectItem value="ultimos_12">Últimos 12 Meses</SelectItem>
                      <SelectItem value="trimestre_atual">Trimestre Atual</SelectItem>
                      <SelectItem value="ano_atual">Ano Atual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Indicadores de Tendência */}
              {viewMode === 'detalhado' && comparisonData.comparacao.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Indicadores de Tendência
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {comparisonData.comparacao.map((cenario, index) => {
                        const tendencia = calcularTendencia(cenario);
                        return (
                          <Card 
                            key={cenario.cenario_id} 
                            className={tendencia.tipo === 'positiva' ? 'border-green-300 bg-green-50' : 
                                      tendencia.tipo === 'negativa' ? 'border-red-300 bg-red-50' : 
                                      'border-gray-300 bg-gray-50'}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-sm truncate">{cenario.cenario_nome}</p>
                                {tendencia.direcao === 'crescente' ? (
                                  <TrendingUpIcon className="w-5 h-5 text-green-600" />
                                ) : tendencia.direcao === 'decrescente' ? (
                                  <TrendingDown className="w-5 h-5 text-red-600" />
                                ) : (
                                  <Activity className="w-5 h-5 text-gray-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-1">Tendência:</p>
                              <p className="text-sm font-bold mb-2">{tendencia.descricao}</p>
                              <p className={`text-lg font-bold ${
                                tendencia.tipo === 'positiva' ? 'text-green-700' :
                                tendencia.tipo === 'negativa' ? 'text-red-700' :
                                'text-gray-700'
                              }`}>
                                {formatPercent(parseFloat(tendencia.variacao_percentual))}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* KPIs Comparativos */}
              {viewMode === 'detalhado' && comparisonData.comparacao.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Indicadores-Chave (KPIs)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Margem Bruta', 'ROI', 'Payback', 'Crescimento'].map(kpi => (
                        <div key={kpi} className="text-center p-4 bg-gray-50 rounded-lg border">
                          <p className="text-xs text-gray-600 mb-3 font-semibold">{kpi}</p>
                          <div className="space-y-2">
                            {comparisonData.comparacao.map((cenario, idx) => {
                              const kpis = calcularKPIs(cenario);
                              let valor = '';
                              let cor = colors[idx % colors.length];
                              
                              switch (kpi) {
                                case 'Margem Bruta':
                                  valor = `${kpis.margemBruta}%`;
                                  break;
                                case 'ROI':
                                  valor = `${kpis.roi}%`;
                                  break;
                                case 'Payback':
                                  valor = kpis.payback;
                                  break;
                                case 'Crescimento':
                                  valor = `${kpis.crescimento}%`;
                                  break;
                              }
                              
                              return (
                                <div key={cenario.cenario_id} className="mb-1">
                                  <p className="text-xs text-gray-500 mb-0.5">{cenario.cenario_nome}</p>
                                  <p className="text-sm font-semibold" style={{ color: cor }}>
                                    {valor}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Análise de Variância */}
              {viewMode === 'detalhado' && comparisonData.comparacao.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Análise de Variabilidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {comparisonData.comparacao.map(cenario => {
                        const variabilidade = calcularVariabilidade(cenario);
                        const getEstabilidadeBadge = () => {
                          switch (variabilidade.estabilidade) {
                            case 'muito_estavel':
                              return <Badge className="bg-green-600">Muito Estável</Badge>;
                            case 'estavel':
                              return <Badge className="bg-blue-600">Estável</Badge>;
                            case 'moderadamente_variavel':
                              return <Badge className="bg-yellow-600">Moderadamente Variável</Badge>;
                            default:
                              return <Badge className="bg-red-600">Variável</Badge>;
                          }
                        };
                        
                        return (
                          <div key={cenario.cenario_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{cenario.cenario_nome}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Desvio Padrão: {formatCurrency(variabilidade.desvio_padrao)} | 
                                Coef. Variação: {variabilidade.coeficiente_variacao}
                              </p>
                            </div>
                            <div className="ml-4">
                              {getEstabilidadeBadge()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabela de Ranking */}
              {ranking.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Ranking de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Posição</TableHead>
                            <TableHead>Cenário</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Saldo Líquido</TableHead>
                            <TableHead className="text-right">Margem (%)</TableHead>
                            <TableHead>Classificação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ranking.map((cenario, index) => (
                            <TableRow key={cenario.cenario_id}>
                              <TableCell>
                                <Badge 
                                  className={
                                    index === 0 ? 'bg-yellow-500 text-white' : 
                                    index === 1 ? 'bg-gray-400 text-white' : 
                                    index === 2 ? 'bg-orange-600 text-white' : 
                                    'bg-gray-200 text-gray-700'
                                  }
                                >
                                  {index + 1}º
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <p>{cenario.cenario_nome}</p>
                                  <p className="text-xs text-gray-500">{cenario.projeto_nome}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {cenario.score}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(cenario.estatisticas.saldo_liquido)}
                              </TableCell>
                              <TableCell className="text-right">
                                {cenario.margem}%
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={
                                    cenario.classificacao === 'Excelente' ? 'bg-green-600' :
                                    cenario.classificacao === 'Bom' ? 'bg-blue-600' :
                                    cenario.classificacao === 'Médio' ? 'bg-yellow-600' :
                                    'bg-gray-600'
                                  }
                                >
                                  {cenario.classificacao}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botão de Exportação */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <Download className="w-4 h-4 mr-2" />
                      CSV (Dados)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                          <TableHead className="text-right">Margem (%)</TableHead>
                          <TableHead className="text-right">Ticket Médio</TableHead>
                          <TableHead className="text-right">Razão E/S</TableHead>
                          <TableHead className="text-right">Cresc. Médio</TableHead>
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
                          const baseStats = comparisonData.comparacao[0].estatisticas;
                          const highlightSaldo = !isBase ? destacarDiferenca(stats.saldo_liquido, baseStats.saldo_liquido, 'saldo') : '';
                          const metricas = calcularMetricasFinanceiras(cenario);

                          return (
                            <TableRow 
                              key={cenario.cenario_id}
                              className={highlightSaldo}
                            >
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
                              } ${highlightSaldo ? 'font-extrabold' : ''}`}>
                                {formatCurrency(stats.saldo_liquido)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${
                                  metricas.margemLucro >= 20 ? 'text-green-600' :
                                  metricas.margemLucro >= 10 ? 'text-blue-600' :
                                  metricas.margemLucro >= 0 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {metricas.margemLucro}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(metricas.ticketMedio)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${
                                  metricas.razaoES >= 1.5 ? 'text-green-600' :
                                  metricas.razaoES >= 1.0 ? 'text-blue-600' :
                                  'text-red-600'
                                }`}>
                                  {metricas.razaoES}x
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`text-sm ${
                                  parseFloat(metricas.crescimentoMedio) > 0 ? 'text-green-600' :
                                  parseFloat(metricas.crescimentoMedio) < 0 ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {formatPercent(parseFloat(metricas.crescimentoMedio))}
                                </span>
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
                        <Brush 
                          dataKey="periodo" 
                          height={30} 
                          stroke="#8884d8"
                          tickFormatter={(value) => value}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Barras Agrupadas - Entradas vs Saídas */}
              {comparisonData.comparacao.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entradas vs Saídas por Cenário</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={comparisonData.comparacao.map(cenario => ({
                          nome: cenario.cenario_nome,
                          entradas: cenario.estatisticas.total_entradas,
                          saidas: cenario.estatisticas.total_saidas
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="nome" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                        />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                        <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico Radar - Análise Multi-Dimensional */}
              {viewMode === 'detalhado' && comparisonData.comparacao.length > 0 && prepareRadarData().length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Análise Multi-Dimensional (Radar)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={500}>
                      <RadarChart data={prepareRadarData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        {comparisonData.comparacao.map((cenario, index) => (
                          <Radar
                            key={cenario.cenario_id}
                            name={cenario.cenario_nome}
                            dataKey={`cenario_${cenario.cenario_id}`}
                            stroke={colors[index % colors.length]}
                            fill={colors[index % colors.length]}
                            fillOpacity={0.6}
                            strokeWidth={2}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-xs text-gray-500 text-center">
                      <p>Métricas normalizadas em escala 0-100 para comparação visual</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Matriz de Correlação */}
              {viewMode === 'detalhado' && comparisonData.comparacao.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5" />
                      Matriz de Correlação entre Cenários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">Cenário</TableHead>
                            {comparisonData.comparacao.map(cenario => (
                              <TableHead key={cenario.cenario_id} className="text-center font-semibold">
                                {cenario.cenario_nome}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comparisonData.comparacao.map(cenario1 => (
                            <TableRow key={cenario1.cenario_id}>
                              <TableCell className="font-medium">
                                {cenario1.cenario_nome}
                              </TableCell>
                              {comparisonData.comparacao.map(cenario2 => {
                                const correlacao = calcularCorrelacao(cenario1, cenario2);
                                const correlacaoFormatada = correlacao.toFixed(3);
                                
                                // Determinar cor do badge baseado na correlação
                                let badgeClass = 'bg-gray-600';
                                let label = 'Baixa';
                                
                                if (correlacao >= 0.8) {
                                  badgeClass = 'bg-green-600';
                                  label = 'Alta';
                                } else if (correlacao >= 0.5) {
                                  badgeClass = 'bg-blue-600';
                                  label = 'Média';
                                } else if (correlacao >= 0.3) {
                                  badgeClass = 'bg-yellow-600';
                                  label = 'Baixa';
                                } else if (correlacao >= -0.3) {
                                  badgeClass = 'bg-gray-600';
                                  label = 'Nula';
                                } else {
                                  badgeClass = 'bg-red-600';
                                  label = 'Negativa';
                                }
                                
                                return (
                                  <TableCell key={cenario2.cenario_id} className="text-center">
                                    {cenario1.cenario_id === cenario2.cenario_id ? (
                                      <Badge className="bg-gray-400">1.000</Badge>
                                    ) : (
                                      <div className="flex flex-col items-center gap-1">
                                        <Badge className={badgeClass}>
                                          {correlacaoFormatada}
                                        </Badge>
                                        <span className="text-xs text-gray-500">{label}</span>
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-700">
                        <strong>Interpretação:</strong> Valores próximos de 1.0 indicam alta correlação positiva 
                        (cenários se comportam de forma similar). Valores próximos de -1.0 indicam correlação 
                        negativa (comportamento oposto). Valores próximos de 0 indicam pouca ou nenhuma correlação.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Entradas Comparativas */}
              {viewMode === 'detalhado' && chartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Entradas Comparativas ao Longo do Tempo</CardTitle>
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
                        <Brush 
                          dataKey="periodo" 
                          height={30} 
                          stroke="#8884d8"
                          tickFormatter={(value) => value}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end shadow-sm flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioComparisonModal;

