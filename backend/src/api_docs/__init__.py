"""
Módulo de documentação da API
"""
from flask_restx import Namespace

# Criar namespaces para cada grupo de endpoints
auth_ns = Namespace('auth', description='Operações de autenticação')
projetos_ns = Namespace('projetos', description='Gerenciamento de projetos')
cenarios_ns = Namespace('cenarios', description='Gerenciamento de cenários')
lancamentos_ns = Namespace('lancamentos', description='Gerenciamento de lançamentos')
upload_ns = Namespace('upload', description='Upload de planilhas')
dashboard_ns = Namespace('dashboard', description='Dashboard e estatísticas')
admin_ns = Namespace('admin', description='Operações administrativas')
settings_ns = Namespace('settings', description='Configurações do usuário')

# Lista de todos os namespaces
namespaces = [
    auth_ns,
    projetos_ns,
    cenarios_ns,
    lancamentos_ns,
    upload_ns,
    dashboard_ns,
    admin_ns,
    settings_ns,
]

