"""
Configuração do Swagger/OpenAPI para documentação da API
"""
from flask_restx import Api
from flask import Blueprint

# Criar blueprint para documentação
api_docs_bp = Blueprint('api_docs', __name__, url_prefix='/api/docs')

# Configurar API do Swagger
api = Api(
    api_docs_bp,
    version='1.0',
    title='Habitus Forecast API',
    description='API REST para o sistema Habitus Forecast - Gestão Financeira e Projeção de Fluxo de Caixa',
    doc='/swagger',  # URL da documentação Swagger UI
    authorizations={
        'Bearer Auth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': 'Digite "Bearer {token}" no campo abaixo'
        }
    },
    security='Bearer Auth',
    tags=[
        {'name': 'Autenticação', 'description': 'Endpoints de autenticação e registro'},
        {'name': 'Projetos', 'description': 'Gerenciamento de projetos financeiros'},
        {'name': 'Cenários', 'description': 'Gerenciamento de cenários de projeção'},
        {'name': 'Lançamentos', 'description': 'Gerenciamento de lançamentos financeiros'},
        {'name': 'Upload', 'description': 'Upload e processamento de planilhas'},
        {'name': 'Dashboard', 'description': 'Dados e estatísticas do dashboard'},
        {'name': 'Admin', 'description': 'Endpoints administrativos'},
        {'name': 'Settings', 'description': 'Configurações do usuário'},
    ]
)

# Importar namespaces
from src.api_docs import namespaces

# Registrar namespaces
for ns in namespaces:
    api.add_namespace(ns)

# Importar documentação dos endpoints (para registrar no Swagger)
try:
    from src.routes import auth_docs, projetos_docs, upload_docs, dashboard_docs, admin_docs, settings_docs
except ImportError:
    pass

