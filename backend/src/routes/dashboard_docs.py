"""
Documentação Swagger para endpoints de dashboard
"""
try:
    from flask_restx import Resource
    from flask_restx import reqparse
    from src.api_docs import dashboard_ns
    from src.schemas.dashboard_schema import (
        dashboard_stats_schema, fluxo_caixa_schema, categorias_data_schema,
        saldo_inicial_schema, ponto_equilibrio_schema
    )
    
    @dashboard_ns.route('/dashboard/stats')
    @dashboard_ns.doc('dashboard_stats')
    class DashboardStats(Resource):
        @dashboard_ns.doc(security='Bearer Auth')
        @dashboard_ns.marshal_with(dashboard_stats_schema)
        @dashboard_ns.param('usuario_id', 'ID do usuário (apenas admin)')
        def get(self):
            """
            Estatísticas gerais do dashboard
            
            Retorna métricas agregadas: total de projetos, cenários, lançamentos,
            receitas, despesas e saldo total.
            """
            pass
    
    @dashboard_ns.route('/dashboard/fluxo-caixa/<int:projeto_id>')
    @dashboard_ns.doc('fluxo_caixa')
    class FluxoCaixa(Resource):
        @dashboard_ns.doc(security='Bearer Auth')
        @dashboard_ns.marshal_with(fluxo_caixa_schema)
        @dashboard_ns.param('cenario', 'Nome do cenário (padrão: Realista)')
        @dashboard_ns.param('usuario_id', 'ID do usuário (apenas admin)')
        def get(self, projeto_id):
            """
            Dados de fluxo de caixa para gráfico
            
            Retorna dados de 12 meses a partir da data base do projeto.
            Inclui linha Habitus Forecast (verde) e FDC Real (preta).
            """
            pass
    
    @dashboard_ns.route('/dashboard/categorias/<int:projeto_id>')
    @dashboard_ns.doc('categorias_data')
    class CategoriasData(Resource):
        @dashboard_ns.doc(security='Bearer Auth')
        @dashboard_ns.marshal_with(categorias_data_schema)
        def get(self, projeto_id):
            """Dados de categorias financeiras para gráfico"""
            pass
    
    @dashboard_ns.route('/dashboard/saldo-inicial')
    @dashboard_ns.doc('saldo_inicial')
    class SaldoInicial(Resource):
        @dashboard_ns.doc(security='Bearer Auth')
        @dashboard_ns.marshal_with(saldo_inicial_schema)
        @dashboard_ns.param('usuario_id', 'ID do usuário (apenas admin)')
        def get(self):
            """Obter saldo inicial de caixa do projeto atual"""
            pass
        
        @dashboard_ns.doc(security='Bearer Auth')
        @dashboard_ns.expect(saldo_inicial_schema)
        @dashboard_ns.marshal_with(saldo_inicial_schema)
        @dashboard_ns.param('usuario_id', 'ID do usuário (apenas admin)')
        def post(self):
            """
            Atualizar saldo inicial de caixa
            
            Valor deve estar entre 0 e 1.000.000
            """
            pass
    
    @dashboard_ns.route('/dashboard/ponto-equilibrio')
    @dashboard_ns.doc('ponto_equilibrio')
    class PontoEquilibrio(Resource):
        @dashboard_ns.doc(security='Bearer Auth')
        @dashboard_ns.expect(ponto_equilibrio_schema)
        @dashboard_ns.marshal_with(ponto_equilibrio_schema)
        def post(self):
            """Atualizar ponto de equilíbrio do projeto"""
            pass

except ImportError:
    pass

