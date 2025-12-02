#!/usr/bin/env python3
import os
import sys

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db, User, CategoriaFinanceira

def init_database():
    """Inicializa o banco de dados com dados padrão"""
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
        
        # Criar usuário de teste
        test_user = User(
            nome='George Santos',
            email='georgersantos@teste.com.br',
            role='admin'
        )
        test_user.set_password('123456')
        db.session.add(test_user)
        
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
        print(f"- Usuário teste: georgersantos@teste.com.br / 123456")
        print(f"- {len(categorias_padrao)} categorias financeiras")
        print("Banco de dados inicializado com sucesso!")

if __name__ == '__main__':
    init_database()
