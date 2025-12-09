import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.projetos import projetos_bp
from src.routes.upload import upload_bp
from src.routes.dashboard import dashboard_bp
from src.routes.admin import admin_bp
from src.routes.settings import settings_bp


def validate_environment_variables():
    """
    Valida variáveis de ambiente obrigatórias em produção.
    Retorna tupla (missing_vars, invalid_vars) com listas de variáveis faltantes ou inválidas.
    """
    flask_env = os.getenv('FLASK_ENV', 'development')
    is_production = flask_env == 'production'
    
    if not is_production:
        return [], []  # Não validar em desenvolvimento
    
    missing_vars = []
    invalid_vars = []
    
    # Variáveis obrigatórias em produção
    required_vars = {
        'SECRET_KEY': {
            'description': 'Chave secreta para assinatura de tokens JWT',
            'validate': lambda v: v and len(v) >= 32,
            'error_msg': 'deve ter pelo menos 32 caracteres'
        },
        'DATABASE_URL': {
            'description': 'URL de conexão com o banco de dados PostgreSQL',
            'validate': lambda v: v and v.startswith('postgresql://'),
            'error_msg': 'deve começar com postgresql://'
        }
    }
    
    # Validar variáveis obrigatórias
    for var_name, config in required_vars.items():
        value = os.getenv(var_name)
        if not value:
            missing_vars.append({
                'name': var_name,
                'description': config['description']
            })
        elif 'validate' in config and not config['validate'](value):
            invalid_vars.append({
                'name': var_name,
                'description': config['description'],
                'error': config.get('error_msg', 'valor inválido'),
                'current_value': value[:20] + '...' if len(value) > 20 else value
            })
    
    return missing_vars, invalid_vars

# Documentação da API (Swagger)
try:
    from src.api_docs.swagger_config import api_docs_bp
    SWAGGER_AVAILABLE = True
except ImportError:
    SWAGGER_AVAILABLE = False
    # Log será configurado depois, usar print temporariamente
    import warnings
    warnings.warn("Flask-RESTX não instalado. Documentação Swagger desabilitada.", UserWarning)

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Validar variáveis de ambiente obrigatórias em produção
missing_vars, invalid_vars = validate_environment_variables()
if missing_vars or invalid_vars:
    error_messages = []
    
    if missing_vars:
        error_messages.append("\n❌ Variáveis de ambiente obrigatórias não configuradas:")
        for var in missing_vars:
            error_messages.append(f"   - {var['name']}: {var['description']}")
    
    if invalid_vars:
        error_messages.append("\n❌ Variáveis de ambiente com valores inválidos:")
        for var in invalid_vars:
            error_messages.append(
                f"   - {var['name']}: {var['description']}\n"
                f"     Erro: {var['error']}\n"
                f"     Valor atual: {var.get('current_value', 'N/A')}"
            )
    
    error_messages.append("\n💡 Configure as variáveis no arquivo .env ou como variáveis de ambiente.")
    error_messages.append("   Consulte env.production.example para exemplos.")
    
    raise ValueError('\n'.join(error_messages))

# Configurar SECRET_KEY a partir de variável de ambiente
# Em produção, SECRET_KEY é obrigatória e não deve ter fallback
secret_key = os.getenv('SECRET_KEY')
if not secret_key:
    flask_env = os.getenv('FLASK_ENV', 'development')
    if flask_env == 'production':
        raise ValueError(
            'SECRET_KEY deve ser configurada em produção! '
            'Configure a variável de ambiente SECRET_KEY antes de iniciar a aplicação.'
        )
    # Fallback apenas para desenvolvimento (NUNCA usar em produção)
    secret_key = 'habitus_secret_key_2025_dev_only_never_use_in_production'
    import warnings
    warnings.warn(
        '⚠️ SECRET_KEY não configurada! Usando valor padrão de desenvolvimento. '
        'Configure SECRET_KEY em produção!',
        UserWarning
    )
app.config['SECRET_KEY'] = secret_key

# Configurar CORS a partir de variável de ambiente
flask_env = os.getenv('FLASK_ENV', 'development')
is_production = flask_env == 'production'

cors_origins_env = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5000,http://localhost:5173')
cors_origins_list = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]

# Validar CORS em produção: não permitir localhost
if is_production:
    localhost_origins = [origin for origin in cors_origins_list 
                        if 'localhost' in origin.lower() or '127.0.0.1' in origin]
    if localhost_origins:
        import warnings
        warnings.warn(
            f'⚠️ CORS configurado com origens localhost em produção: {localhost_origins}. '
            'Isso pode ser um risco de segurança. Configure apenas domínios de produção.',
            UserWarning
        )
        # Em produção, remover localhost das origens permitidas
        cors_origins_list = [origin for origin in cors_origins_list 
                           if origin not in localhost_origins]
        
        if not cors_origins_list:
            raise ValueError(
                'CORS_ORIGINS em produção não pode conter apenas localhost. '
                'Configure pelo menos um domínio de produção válido.'
            )

CORS(app, 
     origins=cors_origins_list,
     expose_headers=['X-Report-Pages', 'X-Report-Sheets', 'X-Report-Template', 'X-Report-Period'])

# Configurar Sentry para monitoramento de erros (opcional)
sentry_dsn = os.getenv('SENTRY_DSN')
if sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FlaskIntegration(),
                SqlalchemyIntegration(),
            ],
            # Performance monitoring
            traces_sample_rate=0.1 if is_production else 1.0,
            # Capture 100% of errors in production
            environment=flask_env,
            # Release version (opcional)
            release=os.getenv('APP_VERSION', 'unknown'),
        )
        app.logger.info("Sentry configurado para monitoramento de erros")
    except ImportError:
        app.logger.warning("sentry-sdk não instalado. Instale com: pip install sentry-sdk[flask]")
    except Exception as e:
        app.logger.warning(f"Erro ao configurar Sentry: {str(e)}")
elif is_production:
    app.logger.warning("⚠️ SENTRY_DSN não configurado. Monitoramento de erros desabilitado.")

# Configurar logging estruturado
try:
    from src.utils.logging_config import setup_logging
    setup_logging(app)
except Exception as e:
    import warnings
    warnings.warn(f"Erro ao configurar logging: {str(e)}", UserWarning)

# Configurar segurança e rate limiting
try:
    from src.middleware.security import setup_security_headers, setup_rate_limiting
    setup_security_headers(app)
    limiter = setup_rate_limiting(app)
    if limiter:
        app.logger.info("Security headers e rate limiting configurados")
except Exception as e:
    app.logger.warning(f"Erro ao configurar segurança: {str(e)}")

# Registrar blueprint de documentação (se disponível)
if SWAGGER_AVAILABLE:
    app.register_blueprint(api_docs_bp)

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(projetos_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(settings_bp)

# Configuração do banco de dados
# Usar DATABASE_URL se disponível (para CI/produção), senão usar SQLite local
database_url = os.getenv('DATABASE_URL')

# Se DATABASE_URL apontar para PostgreSQL, verificar se pode ser usada
if database_url and database_url.startswith('postgresql://'):
    try:
        import psycopg2
        # Tentar testar a conexão (detecta problemas de encoding/conexão)
        try:
            from sqlalchemy import create_engine, text
            # Criar engine temporário para testar
            test_engine = create_engine(database_url, connect_args={'connect_timeout': 2})
            # Tentar conectar brevemente
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            test_engine.dispose()
        except UnicodeDecodeError as e:
            # Erro de encoding na URL - usar SQLite silenciosamente (comum em dev)
            database_url = None
        except Exception as e:
            # Outros erros de conexão
            error_msg = str(e)
            if 'utf-8' in error_msg.lower() or 'codec' in error_msg.lower() or 'decode' in error_msg.lower():
                # Erro de encoding - usar SQLite silenciosamente
                database_url = None
            else:
                # Outro tipo de erro (conexão recusada, timeout, etc.)
                # Só mostrar se não for erro de encoding
                print(f"ℹ️ Não foi possível conectar ao PostgreSQL.")
                print("ℹ️ Usando SQLite local para desenvolvimento.")
                database_url = None
    except ImportError:
        # psycopg2 não instalado - usar SQLite silenciosamente em dev
        database_url = None

# Configurar URI do banco de dados
if database_url:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Para SQLite local, garantir que o diretório existe
    database_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database')
    os.makedirs(database_dir, exist_ok=True)
    database_path = os.path.join(database_dir, 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{database_path}"
    # Log será configurado depois, usar print temporariamente apenas em dev
    if os.getenv('FLASK_ENV', 'development') != 'production':
        print(f"📦 Usando banco SQLite local: {database_path}")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db.init_app(app)

# Criar tabelas e dados iniciais apenas se não estiver em modo de teste/CI
# No CI, isso será feito pelo step de migrations/testes
if not os.getenv('SKIP_DB_INIT'):
    with app.app_context():
        db.create_all()
        
        # Criar usuário admin padrão se não existir
        from src.models.user import User, CategoriaFinanceira
        admin_user = User.query.filter_by(email='admin@habitus.com').first()
        if not admin_user:
            admin_user = User(
                nome='Administrador',
                email='admin@habitus.com',
                role='admin',
                status='active'
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
        
        # Criar categorias financeiras padrão se não existirem
        categorias_padrao = [
            ('FATURAMENTO', 'OPERACIONAL'),
            ('ENTRADAS OPERACIONAIS', 'OPERACIONAL'),
            ('MARGEM CONTRIBUIÇÃO', 'OPERACIONAL'),
            ('GASTOS FIXOS', 'OPERACIONAL'),
            ('FDC OPERACIONAL', 'OPERACIONAL'),
            ('IMPOSTOS', 'OPERACIONAL'),
            ('COMISSÕES', 'OPERACIONAL'),
            ('CUSTOS SERVIÇOS', 'OPERACIONAL'),
            ('DESPESAS PESSOAL', 'OPERACIONAL'),
            ('DESPESAS ADMINISTRATIVAS', 'OPERACIONAL'),
            ('DESPESAS FINANCEIRAS', 'OPERACIONAL'),
            ('INVESTIMENTOS', 'INVESTIMENTO'),
            ('FINANCIAMENTOS', 'FINANCIAMENTO'),
        ]
        
        for nome, tipo_fluxo in categorias_padrao:
            categoria_existente = CategoriaFinanceira.query.filter_by(nome=nome).first()
            if not categoria_existente:
                categoria = CategoriaFinanceira(nome=nome, tipo_fluxo=tipo_fluxo)
                db.session.add(categoria)
        
        db.session.commit()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve arquivos estáticos e SPA routing"""
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de verificação de saúde da API"""
    return {'status': 'ok', 'message': 'Habitus Forecast API está funcionando'}

if __name__ == '__main__':
    # Debug mode deve ser controlado por variável de ambiente
    # Em produção, sempre desabilitado
    flask_env = os.getenv('FLASK_ENV', 'development')
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    # Garantir que debug está desabilitado em produção
    if flask_env == 'production':
        debug_mode = False
    
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
