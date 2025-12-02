"""
Schemas para Dashboard
"""
from flask_restx import fields, Model

# Schema de estatísticas do dashboard
dashboard_stats_schema = Model('DashboardStats', {
    'total_projetos': fields.Integer(description='Total de projetos'),
    'total_cenarios': fields.Integer(description='Total de cenários'),
    'total_lancamentos': fields.Integer(description='Total de lançamentos'),
    'receita_total': fields.Float(description='Receita total'),
    'despesa_total': fields.Float(description='Despesa total'),
    'saldo_total': fields.Float(description='Saldo total'),
})

# Schema de fluxo de caixa
fluxo_caixa_schema = Model('FluxoCaixa', {
    'meses': fields.List(fields.String, description='Lista de meses'),
    'valores': fields.List(fields.Float, description='Valores por mês'),
    'habitus_forecast': fields.List(fields.Float, description='Valores Habitus Forecast'),
    'fdc_real': fields.List(fields.Float, description='Valores FDC Real'),
})

# Schema de dados de categorias
categorias_data_schema = Model('CategoriasData', {
    'categorias': fields.List(fields.String, description='Nomes das categorias'),
    'valores': fields.List(fields.Float, description='Valores por categoria'),
    'tipos': fields.List(fields.String, description='Tipos de fluxo por categoria'),
})

# Schema de atualização de saldo inicial
saldo_inicial_schema = Model('SaldoInicial', {
    'saldo_inicial': fields.Float(required=True, min=0, max=1000000, description='Saldo inicial de caixa (0 a 1.000.000)'),
})

# Schema de ponto de equilíbrio
ponto_equilibrio_schema = Model('PontoEquilibrio', {
    'ponto_equilibrio': fields.Float(required=True, description='Ponto de equilíbrio'),
})

