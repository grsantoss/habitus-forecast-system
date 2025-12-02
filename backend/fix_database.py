#!/usr/bin/env python3
import os
import sys

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db, User, CategoriaFinanceira

def fix_database():
    """Corrige a estrutura do banco de dados"""
    with app.app_context():
        print("Corrigindo estrutura do banco de dados...")
        
        # Remover tabelas existentes e recriar
        db.drop_all()
        db.create_all()
        
        print("OK - Banco de dados recriado com sucesso!")
        
        # Criar usuário admin padrão
        admin_user = User(
            nome='George Santos',
            email='georgersantos@teste.com.br',
            role='admin'
        )
        admin_user.set_password('123456')
        db.session.add(admin_user)
        
        # Criar categorias financeiras padrão
        categorias = [
            ('FATURAMENTO', 'OPERACIONAL'),
            ('ENTRADAS OPERACIONAIS', 'OPERACIONAL'),
            ('MARGEM CONTRIBUIÇÃO', 'OPERACIONAL'),
            ('GASTOS FIXOS', 'OPERACIONAL'),
            ('FDC-REAL', 'OPERACIONAL')
        ]
        
        for nome, tipo in categorias:
            categoria = CategoriaFinanceira(nome=nome, tipo_fluxo=tipo)
            db.session.add(categoria)
        
        db.session.commit()
        print("OK - Usuario admin e categorias criados!")
        print("SUCESSO - Banco de dados corrigido com sucesso!")

if __name__ == "__main__":
    fix_database()