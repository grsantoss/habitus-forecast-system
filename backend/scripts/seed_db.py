#!/usr/bin/env python3
"""
Script para popular o banco de dados com dados iniciais.
Execute apenas uma vez após criar o banco de dados.
"""
import os
import sys

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from src.main import app
from src.models.user import User, CategoriaFinanceira, db

def seed_database():
    """Popula o banco de dados com dados iniciais"""
    with app.app_context():
        # Criar usuário admin padrão se não existir
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
            print("✓ Usuário admin criado: admin@habitus.com / admin123")
        else:
            print("ℹ Usuário admin já existe")
        
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
        
        categorias_criadas = 0
        for nome, tipo_fluxo in categorias_padrao:
            categoria_existente = CategoriaFinanceira.query.filter_by(nome=nome).first()
            if not categoria_existente:
                categoria = CategoriaFinanceira(nome=nome, tipo_fluxo=tipo_fluxo)
                db.session.add(categoria)
                categorias_criadas += 1
        
        db.session.commit()
        
        if categorias_criadas > 0:
            print(f"✓ {categorias_criadas} categorias financeiras criadas")
        else:
            print("ℹ Todas as categorias financeiras já existem")
        
        print("\n✓ Banco de dados populado com sucesso!")

if __name__ == '__main__':
    seed_database()

