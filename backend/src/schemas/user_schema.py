"""
Schemas para modelos de Usuário
"""
from flask_restx import fields, Model

# Schema de Usuário
user_schema = Model('User', {
    'id': fields.Integer(required=True, description='ID do usuário'),
    'nome': fields.String(required=True, description='Nome completo'),
    'email': fields.String(required=True, description='Email do usuário'),
    'role': fields.String(required=True, enum=['admin', 'usuario'], description='Papel do usuário'),
    'status': fields.String(required=True, enum=['pending', 'active', 'rejected'], description='Status do usuário'),
    'telefone': fields.String(description='Telefone'),
    'empresa': fields.String(description='Nome da empresa'),
    'cnpj': fields.String(description='CNPJ da empresa'),
    'cargo': fields.String(description='Cargo do usuário'),
    'created_at': fields.DateTime(description='Data de criação'),
    'updated_at': fields.DateTime(description='Data de atualização'),
}, description='GET /api/auth/me retorna {"user": {...}}. Extrair objeto user antes de acessar campos')

# Schema para criação de usuário
user_create_schema = Model('UserCreate', {
    'nome': fields.String(required=True, description='Nome completo'),
    'email': fields.String(required=True, description='Email do usuário'),
    'password': fields.String(required=True, description='Senha'),
    'role': fields.String(enum=['admin', 'usuario'], default='usuario', description='Papel do usuário'),
    'telefone': fields.String(description='Telefone'),
    'empresa': fields.String(description='Nome da empresa'),
    'cnpj': fields.String(description='CNPJ da empresa'),
    'cargo': fields.String(description='Cargo do usuário'),
})

# Schema para atualização de usuário
user_update_schema = Model('UserUpdate', {
    'nome': fields.String(description='Nome completo'),
    'email': fields.String(description='Email do usuário'),
    'role': fields.String(enum=['admin', 'usuario'], description='Papel do usuário'),
    'status': fields.String(enum=['pending', 'active', 'rejected'], description='Status do usuário'),
    'telefone': fields.String(description='Telefone'),
    'empresa': fields.String(description='Nome da empresa'),
    'cnpj': fields.String(description='CNPJ da empresa'),
    'cargo': fields.String(description='Cargo do usuário'),
})

# Schema de login
login_schema = Model('Login', {
    'email': fields.String(required=True, description='Email do usuário'),
    'password': fields.String(required=True, description='Senha'),
})

# Schema de resposta de login
login_response_schema = Model('LoginResponse', {
    'access_token': fields.String(required=True, description='Token JWT de acesso'),
    'token_type': fields.String(required=True, default='bearer', description='Tipo do token'),
    'user': fields.Nested(user_schema, required=True, description='Dados do usuário autenticado'),
}, description='Resposta de login contém access_token, token_type e objeto user')

# Schema de registro
register_schema = Model('Register', {
    'nome': fields.String(required=True, description='Nome completo (OBRIGATÓRIO)'),
    'email': fields.String(required=True, description='Email do usuário (OBRIGATÓRIO)'),
    'password': fields.String(required=True, description='Senha (OBRIGATÓRIO)'),
    'role': fields.String(enum=['admin', 'usuario'], default='usuario', description='Papel do usuário'),
    'telefone': fields.String(description='Telefone'),
    'empresa': fields.String(description='Nome da empresa'),
    'cnpj': fields.String(description='CNPJ da empresa'),
    'cargo': fields.String(description='Cargo do usuário'),
}, description='Campos obrigatórios: nome, email, password. Resposta contém {"message": "...", "user": {...}}')

