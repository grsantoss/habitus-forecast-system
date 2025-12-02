"""
Documentação Swagger para endpoints de autenticação
"""
try:
    from flask_restx import Resource
    from src.api_docs import auth_ns
    from src.schemas.user_schema import (
        login_schema, login_response_schema, register_schema, user_schema
    )
    
    @auth_ns.route('/login')
    @auth_ns.doc('login')
    class Login(Resource):
        @auth_ns.doc('login_user')
        @auth_ns.expect(login_schema)
        @auth_ns.marshal_with(login_response_schema, code=200)
        @auth_ns.response(400, 'Dados inválidos')
        @auth_ns.response(401, 'Credenciais inválidas')
        @auth_ns.response(403, 'Usuário bloqueado ou pendente')
        def post(self):
            """
            Autenticar usuário e obter token JWT
            
            Retorna um token de acesso JWT válido por 24 horas.
            O token deve ser incluído no header Authorization: Bearer {token}
            """
            pass
    
    @auth_ns.route('/register')
    @auth_ns.doc('register')
    class Register(Resource):
        @auth_ns.doc('register_user')
        @auth_ns.expect(register_schema)
        @auth_ns.marshal_with(user_schema, code=201)
        @auth_ns.response(400, 'Dados inválidos')
        @auth_ns.response(409, 'Email já cadastrado')
        def post(self):
            """
            Registrar novo usuário
            
            Cria uma nova conta de usuário. O status inicial será 'pending'
            até aprovação do administrador.
            """
            pass
    
    @auth_ns.route('/me')
    @auth_ns.doc('get_current_user')
    class Me(Resource):
        @auth_ns.doc(security='Bearer Auth')
        @auth_ns.marshal_with(user_schema)
        @auth_ns.response(401, 'Não autenticado')
        def get(self):
            """
            Obter dados do usuário atual
            
            Retorna os dados do usuário autenticado baseado no token JWT.
            """
            pass
    
    @auth_ns.route('/logout')
    @auth_ns.doc('logout')
    class Logout(Resource):
        @auth_ns.doc(security='Bearer Auth')
        @auth_ns.response(200, 'Logout realizado')
        @auth_ns.response(401, 'Não autenticado')
        def post(self):
            """
            Fazer logout
            
            Invalida o token atual. O cliente deve remover o token do storage.
            """
            pass

except ImportError:
    # Se Flask-RESTX não estiver instalado, não fazer nada
    pass

