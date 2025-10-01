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

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'habitus_secret_key_2025_super_secure'

# Configurar CORS para permitir requisições do frontend
CORS(app, origins=["http://localhost:3000", "http://localhost:5000", "http://localhost:5173"])

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(projetos_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db.init_app(app)

# Criar tabelas e dados iniciais
with app.app_context():
    db.create_all()
    
    # Criar usuário admin padrão se não existir
    from src.models.user import User, CategoriaFinanceira
    admin_user = User.query.filter_by(email='admin@habitus.com').first()
    if not admin_user:
        admin_user = User(
            nome='Administrador',
            email='admin@habitus.com',
            role='admin'
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
    app.run(host='0.0.0.0', port=5000, debug=True)
