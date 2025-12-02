"""
Documentação Swagger para endpoints de settings
"""
try:
    from flask_restx import Resource
    from flask_restx import Model, fields
    from src.api_docs import settings_ns
    
    # Schema de configuração de cenários
    cenarios_config_schema = Model('CenariosConfig', {
        'pessimista': fields.Float(required=True, min=-100, max=100, description='Percentual pessimista (≤ 0)'),
        'realista': fields.Float(required=True, default=0, description='Percentual realista (sempre 0)'),
        'otimista': fields.Float(required=True, min=0, max=100, description='Percentual otimista (≥ 0)'),
        'agressivo': fields.Float(required=True, min=0, max=100, description='Percentual agressivo (≥ 0)'),
    })
    
    # Schema de perfil
    profile_schema = Model('Profile', {
        'nome': fields.String(description='Nome completo'),
        'email': fields.String(description='Email'),
        'telefone': fields.String(description='Telefone'),
        'empresa': fields.String(description='Empresa'),
        'cnpj': fields.String(description='CNPJ'),
        'cargo': fields.String(description='Cargo'),
    })
    
    # Schema de alteração de senha
    password_change_schema = Model('PasswordChange', {
        'senha_atual': fields.String(required=True, description='Senha atual'),
        'nova_senha': fields.String(required=True, description='Nova senha'),
        'confirmar_senha': fields.String(required=True, description='Confirmar nova senha'),
    })
    
    @settings_ns.route('/settings/cenarios')
    @settings_ns.doc('settings_cenarios')
    class SettingsCenarios(Resource):
        @settings_ns.doc(security='Bearer Auth')
        @settings_ns.marshal_with(cenarios_config_schema)
        @settings_ns.param('usuario_id', 'ID do usuário (apenas admin)')
        def get(self):
            """
            Obter configurações de cenários
            
            Retorna os percentuais configurados para cada cenário:
            - Pessimista: variação abaixo do Realista (≤ 0)
            - Realista: ponto zero/base (sempre 0)
            - Otimista: variação acima do Realista (≥ 0)
            - Agressivo: variação acima do Realista (≥ 0)
            """
            pass
        
        @settings_ns.doc(security='Bearer Auth')
        @settings_ns.expect(cenarios_config_schema)
        @settings_ns.marshal_with(cenarios_config_schema)
        @settings_ns.param('usuario_id', 'ID do usuário (apenas admin)')
        @settings_ns.response(400, 'Validação falhou')
        def post(self):
            """
            Salvar configurações de cenários
            
            Validações:
            - Pessimista ≤ 0
            - Realista = 0 (sempre)
            - Otimista ≥ 0
            - Agressivo ≥ 0
            - Todos entre -100 e 100
            """
            pass
    
    @settings_ns.route('/settings/profile')
    @settings_ns.doc('settings_profile')
    class SettingsProfile(Resource):
        @settings_ns.doc(security='Bearer Auth')
        @settings_ns.marshal_with(profile_schema)
        def get(self):
            """Obter perfil do usuário"""
            pass
        
        @settings_ns.doc(security='Bearer Auth')
        @settings_ns.expect(profile_schema)
        @settings_ns.marshal_with(profile_schema)
        def put(self):
            """Atualizar perfil do usuário"""
            pass
    
    @settings_ns.route('/settings/password')
    @settings_ns.doc('settings_password')
    class SettingsPassword(Resource):
        @settings_ns.doc(security='Bearer Auth')
        @settings_ns.expect(password_change_schema)
        @settings_ns.response(200, 'Senha alterada com sucesso')
        @settings_ns.response(400, 'Senha atual incorreta ou nova senha inválida')
        def put(self):
            """
            Alterar senha do usuário
            
            Requer senha atual para validação.
            Nova senha e confirmação devem ser iguais.
            """
            pass

except ImportError:
    pass

