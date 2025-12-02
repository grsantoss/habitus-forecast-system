"""
Documentação Swagger para endpoints de projetos e cenários
"""
try:
    from flask_restx import Resource
    from src.api_docs import projetos_ns, cenarios_ns, lancamentos_ns
    from src.schemas.projeto_schema import (
        projeto_schema, projeto_create_schema, projeto_update_schema,
        cenario_schema, cenario_create_schema, cenario_update_schema,
        lancamento_schema, lancamento_create_schema, lancamento_update_schema,
        categoria_schema
    )
    
    @projetos_ns.route('/projetos')
    @projetos_ns.doc('projetos')
    class ProjetoList(Resource):
        @projetos_ns.doc(security='Bearer Auth')
        @projetos_ns.marshal_list_with(projeto_schema)
        @projetos_ns.response(401, 'Não autenticado')
        def get(self):
            """
            Listar todos os projetos do usuário
            
            Retorna lista de projetos associados ao usuário autenticado.
            """
            pass
        
        @projetos_ns.doc(security='Bearer Auth')
        @projetos_ns.expect(projeto_create_schema)
        @projetos_ns.marshal_with(projeto_schema, code=201)
        @projetos_ns.response(400, 'Dados inválidos')
        @projetos_ns.response(401, 'Não autenticado')
        def post(self):
            """
            Criar novo projeto
            
            Cria um novo projeto financeiro associado ao usuário autenticado.
            """
            pass
    
    @projetos_ns.route('/projetos/<int:projeto_id>')
    @projetos_ns.doc('projeto')
    class Projeto(Resource):
        @projetos_ns.doc(security='Bearer Auth')
        @projetos_ns.marshal_with(projeto_schema)
        @projetos_ns.response(404, 'Projeto não encontrado')
        def get(self, projeto_id):
            """Obter projeto específico"""
            pass
        
        @projetos_ns.doc(security='Bearer Auth')
        @projetos_ns.expect(projeto_update_schema)
        @projetos_ns.marshal_with(projeto_schema)
        @projetos_ns.response(404, 'Projeto não encontrado')
        def put(self, projeto_id):
            """Atualizar projeto"""
            pass
        
        @projetos_ns.doc(security='Bearer Auth')
        @projetos_ns.response(204, 'Projeto deletado')
        @projetos_ns.response(404, 'Projeto não encontrado')
        def delete(self, projeto_id):
            """Deletar projeto"""
            pass
    
    @cenarios_ns.route('/cenarios')
    @cenarios_ns.doc('cenarios')
    class CenarioList(Resource):
        @cenarios_ns.doc(security='Bearer Auth')
        @cenarios_ns.marshal_list_with(cenario_schema)
        def get(self):
            """Listar todos os cenários do usuário"""
            pass
    
    @cenarios_ns.route('/projetos/<int:projeto_id>/cenarios')
    @cenarios_ns.doc('criar_cenario')
    class CenarioCreate(Resource):
        @cenarios_ns.doc(security='Bearer Auth')
        @cenarios_ns.expect(cenario_create_schema)
        @cenarios_ns.marshal_with(cenario_schema, code=201)
        def post(self, projeto_id):
            """Criar novo cenário para um projeto"""
            pass
    
    @cenarios_ns.route('/cenarios/<int:cenario_id>')
    @cenarios_ns.doc('cenario')
    class Cenario(Resource):
        @cenarios_ns.doc(security='Bearer Auth')
        @cenarios_ns.expect(cenario_update_schema)
        @cenarios_ns.marshal_with(cenario_schema)
        def put(self, cenario_id):
            """Atualizar cenário"""
            pass
        
        @cenarios_ns.doc(security='Bearer Auth')
        @cenarios_ns.response(204, 'Cenário deletado')
        def delete(self, cenario_id):
            """Deletar cenário"""
            pass
    
    @lancamentos_ns.route('/cenarios/<int:cenario_id>/lancamentos')
    @lancamentos_ns.doc('lancamentos')
    class LancamentoList(Resource):
        @lancamentos_ns.doc(security='Bearer Auth')
        @lancamentos_ns.marshal_list_with(lancamento_schema)
        def get(self, cenario_id):
            """Listar lançamentos de um cenário"""
            pass
        
        @lancamentos_ns.doc(security='Bearer Auth')
        @lancamentos_ns.expect(lancamento_create_schema)
        @lancamentos_ns.marshal_with(lancamento_schema, code=201)
        def post(self, cenario_id):
            """Criar novo lançamento"""
            pass
    
    @lancamentos_ns.route('/cenarios/<int:cenario_id>/lancamentos/<int:lancamento_id>')
    @lancamentos_ns.doc('lancamento')
    class Lancamento(Resource):
        @lancamentos_ns.doc(security='Bearer Auth')
        @lancamentos_ns.expect(lancamento_update_schema)
        @lancamentos_ns.marshal_with(lancamento_schema)
        def put(self, cenario_id, lancamento_id):
            """Atualizar lançamento"""
            pass
        
        @lancamentos_ns.doc(security='Bearer Auth')
        @lancamentos_ns.response(204, 'Lançamento deletado')
        def delete(self, cenario_id, lancamento_id):
            """Deletar lançamento"""
            pass
    
    @projetos_ns.route('/categorias')
    @projetos_ns.doc('categorias')
    class CategoriaList(Resource):
        @projetos_ns.doc(security='Bearer Auth')
        @projetos_ns.marshal_list_with(categoria_schema)
        def get(self):
            """Listar categorias financeiras"""
            pass

except ImportError:
    pass

