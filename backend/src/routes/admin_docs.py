"""
Documentação Swagger para endpoints administrativos
"""
try:
    from flask_restx import Resource
    from flask_restx import reqparse
    from src.api_docs import admin_ns
    from src.schemas.user_schema import user_schema, user_create_schema, user_update_schema
    
    @admin_ns.route('/admin/usuarios')
    @admin_ns.doc('admin_usuarios')
    class AdminUsuarios(Resource):
        @admin_ns.doc(security='Bearer Auth')
        @admin_ns.marshal_list_with(user_schema)
        @admin_ns.param('page', 'Número da página', type='integer', default=1)
        @admin_ns.param('per_page', 'Itens por página', type='integer', default=10)
        @admin_ns.param('search', 'Busca por nome/email')
        @admin_ns.response(401, 'Não autenticado')
        @admin_ns.response(403, 'Acesso negado - requer admin')
        def get(self):
            """
            Listar todos os usuários (Admin)
            
            Retorna lista paginada de todos os usuários do sistema.
            Requer role 'admin'.
            """
            pass
        
        @admin_ns.doc(security='Bearer Auth')
        @admin_ns.expect(user_create_schema)
        @admin_ns.marshal_with(user_schema, code=201)
        @admin_ns.response(403, 'Acesso negado - requer admin')
        def post(self):
            """Criar novo usuário (Admin)"""
            pass
    
    @admin_ns.route('/admin/usuarios/<int:usuario_id>')
    @admin_ns.doc('admin_usuario')
    class AdminUsuario(Resource):
        @admin_ns.doc(security='Bearer Auth')
        @admin_ns.expect(user_update_schema)
        @admin_ns.marshal_with(user_schema)
        @admin_ns.response(403, 'Acesso negado - requer admin')
        def put(self, usuario_id):
            """Atualizar usuário (Admin)"""
            pass
        
        @admin_ns.doc(security='Bearer Auth')
        @admin_ns.response(204, 'Usuário deletado')
        @admin_ns.response(403, 'Acesso negado - requer admin')
        def delete(self, usuario_id):
            """Deletar usuário (Admin)"""
            pass
    
    @admin_ns.route('/admin/logs')
    @admin_ns.doc('admin_logs')
    class AdminLogs(Resource):
        @admin_ns.doc(security='Bearer Auth')
        @admin_ns.param('page', 'Número da página', type='integer', default=1)
        @admin_ns.param('per_page', 'Itens por página', type='integer', default=50)
        @admin_ns.param('acao', 'Filtrar por ação')
        @admin_ns.param('usuario_id', 'Filtrar por usuário', type='integer')
        @admin_ns.response(403, 'Acesso negado - requer admin')
        def get(self):
            """Logs do sistema (Admin)"""
            pass
    
    @admin_ns.route('/admin/estatisticas')
    @admin_ns.doc('admin_estatisticas')
    class AdminEstatisticas(Resource):
        @admin_ns.doc(security='Bearer Auth')
        @admin_ns.response(403, 'Acesso negado - requer admin')
        def get(self):
            """Estatísticas administrativas (Admin)"""
            pass
    
    @admin_ns.route('/admin/projetos')
    @admin_ns.doc('admin_projetos')
    class AdminProjetos(Resource):
        @admin_ns.doc(security='Bearer Auth')
        @admin_ns.param('page', 'Número da página', type='integer', default=1)
        @admin_ns.param('per_page', 'Itens por página', type='integer', default=10)
        @admin_ns.param('search', 'Busca por nome do cliente')
        @admin_ns.response(403, 'Acesso negado - requer admin')
        def get(self):
            """Listar todos os projetos (Admin)"""
            pass

except ImportError:
    pass

