#!/usr/bin/env python3
import os
import sys

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from src.models.user import db, User, CategoriaFinanceira

def create_app():
    """Criar app Flask simples para inicialização"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'habitus_secret_key_2025_super_secure'
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    return app

def init_database():
    """Inicializa o banco de dados com dados padrão"""
    app = create_app()
    
    with app.app_context():
        # Remover tabelas existentes e recriar
        db.drop_all()
        db.create_all()
        
        print("Tabelas criadas com sucesso!")
        
        # Criar usuário admin padrão
        admin_user = User(
            nome='Administrador',
            email='admin@habitus.com',
            role='admin'
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        
        # Criar categorias financeiras padrão
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
            categoria = CategoriaFinanceira(nome=nome, tipo_fluxo=tipo_fluxo)
            db.session.add(categoria)
        
        db.session.commit()
        
        print("Dados iniciais criados:")
        print(f"- Usuário admin: admin@habitus.com / admin123")
        print(f"- {len(categorias_padrao)} categorias financeiras")
        print("Banco de dados inicializado com sucesso!")

if __name__ == '__main__':
    init_database()
