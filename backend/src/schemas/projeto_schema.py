"""
Schemas para modelos de Projeto
"""
from flask_restx import fields, Model

# Schema de Projeto
projeto_schema = Model('Projeto', {
    'id': fields.Integer(required=True, description='ID do projeto'),
    'usuario_id': fields.Integer(required=True, description='ID do usuário proprietário'),
    'nome_cliente': fields.String(required=True, description='Nome do cliente'),
    'data_base_estudo': fields.Date(required=True, description='Data base do estudo'),
    'saldo_inicial_caixa': fields.Float(required=True, description='Saldo inicial de caixa'),
    'ponto_equilibrio': fields.Float(description='Ponto de equilíbrio'),
    'geracao_fdc_livre': fields.Float(description='Geração FDC Livre'),
    'percentual_custo_fixo': fields.Float(description='Percentual de custo fixo'),
    'created_at': fields.DateTime(description='Data de criação'),
    'updated_at': fields.DateTime(description='Data de atualização'),
}, description='GET /api/projetos retorna {"projetos": [...]}. POST /api/projetos retorna {"projeto": {...}}')

# Schema para criação de projeto
projeto_create_schema = Model('ProjetoCreate', {
    'nome_cliente': fields.String(required=True, description='Nome do cliente (OBRIGATÓRIO - não usar "nome")'),
    'data_base_estudo': fields.String(required=True, description='Data base do estudo no formato YYYY-MM-DD (OBRIGATÓRIO - não usar "data_base")'),
    'saldo_inicial_caixa': fields.Float(required=False, default=0, description='Saldo inicial de caixa'),
    'ponto_equilibrio': fields.Float(description='Ponto de equilíbrio'),
}, description='Campos obrigatórios: nome_cliente, data_base_estudo. Resposta contém {"message": "...", "projeto": {...}}')

# Schema para atualização de projeto
projeto_update_schema = Model('ProjetoUpdate', {
    'nome_cliente': fields.String(description='Nome do cliente'),
    'data_base_estudo': fields.Date(description='Data base do estudo'),
    'saldo_inicial_caixa': fields.Float(description='Saldo inicial de caixa'),
    'ponto_equilibrio': fields.Float(description='Ponto de equilíbrio'),
})

# Schema de Cenário
cenario_schema = Model('Cenario', {
    'id': fields.Integer(required=True, description='ID do cenário'),
    'projeto_id': fields.Integer(required=True, description='ID do projeto'),
    'nome': fields.String(required=True, description='Nome do cenário'),
    'descricao': fields.String(description='Descrição do cenário'),
    'is_active': fields.Boolean(description='Cenário ativo'),
    'created_at': fields.DateTime(description='Data de criação'),
})

# Schema para criação de cenário
cenario_create_schema = Model('CenarioCreate', {
    'nome': fields.String(required=True, description='Nome do cenário (OBRIGATÓRIO)'),
    'descricao': fields.String(description='Descrição do cenário'),
    'is_active': fields.Boolean(default=False, description='Cenário ativo (não usar "tipo" ou "percentual_vendas")'),
}, description='URL: POST /api/projetos/{projeto_id}/cenarios (não /api/cenarios/projetos/{id}/cenarios). Resposta contém {"cenario": {...}}')

# Schema para atualização de cenário
cenario_update_schema = Model('CenarioUpdate', {
    'nome': fields.String(description='Nome do cenário'),
    'descricao': fields.String(description='Descrição do cenário'),
    'is_active': fields.Boolean(description='Cenário ativo'),
})

# Schema de Lançamento Financeiro
lancamento_schema = Model('LancamentoFinanceiro', {
    'id': fields.Integer(required=True, description='ID do lançamento'),
    'cenario_id': fields.Integer(required=True, description='ID do cenário'),
    'categoria_id': fields.Integer(required=True, description='ID da categoria'),
    'data_competencia': fields.Date(required=True, description='Data de competência'),
    'valor': fields.Float(required=True, description='Valor do lançamento'),
    'tipo': fields.String(required=True, enum=['ENTRADA', 'SAIDA'], description='Tipo de lançamento'),
    'origem': fields.String(enum=['PROJETADO', 'REALIZADO'], description='Origem do lançamento'),
})

# Schema para criação de lançamento
lancamento_create_schema = Model('LancamentoCreate', {
    'categoria_id': fields.Integer(required=True, description='ID da categoria financeira'),
    'data_competencia': fields.Date(required=True, description='Data de competência (YYYY-MM-DD)'),
    'valor': fields.Float(required=True, description='Valor do lançamento'),
    'tipo': fields.String(required=True, enum=['ENTRADA', 'SAIDA'], description='Tipo de lançamento'),
    'origem': fields.String(enum=['PROJETADO', 'REALIZADO'], default='PROJETADO', description='Origem do lançamento'),
})

# Schema para atualização de lançamento
lancamento_update_schema = Model('LancamentoUpdate', {
    'categoria_id': fields.Integer(description='ID da categoria financeira'),
    'data_competencia': fields.Date(description='Data de competência'),
    'valor': fields.Float(description='Valor do lançamento'),
    'tipo': fields.String(enum=['ENTRADA', 'SAIDA'], description='Tipo de lançamento'),
    'origem': fields.String(enum=['PROJETADO', 'REALIZADO'], description='Origem do lançamento'),
})

# Schema de Categoria Financeira
categoria_schema = Model('CategoriaFinanceira', {
    'id': fields.Integer(required=True, description='ID da categoria'),
    'nome': fields.String(required=True, description='Nome da categoria'),
    'tipo_fluxo': fields.String(required=True, enum=['OPERACIONAL', 'INVESTIMENTO', 'FINANCIAMENTO'], description='Tipo de fluxo'),
})

