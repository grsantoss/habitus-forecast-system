#!/usr/bin/env python3
"""
Script para migrar dados do SQLite para PostgreSQL.
Execute este script após configurar o PostgreSQL e antes de desativar o SQLite.
"""
import os
import sys
import sqlite3
from urllib.parse import urlparse

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

from src.main import app
from src.models.user import (
    User, Projeto, Cenario, CategoriaFinanceira, 
    LancamentoFinanceiro, ArquivoUpload, ConfiguracaoCenarios,
    LogSistema, HistoricoCenario, db
)

def migrate_sqlite_to_postgres():
    """Migra dados do SQLite para PostgreSQL"""
    
    # Obter URLs dos bancos
    sqlite_url = os.getenv('SQLITE_DATABASE_URL', 'sqlite:///database/app.db')
    postgres_url = os.getenv('DATABASE_URL')
    
    if not postgres_url:
        print("❌ Erro: DATABASE_URL não configurado no .env")
        print("Configure DATABASE_URL com a URL do PostgreSQL antes de executar a migração")
        return
    
    if not postgres_url.startswith('postgresql://'):
        print("❌ Erro: DATABASE_URL não é uma URL PostgreSQL válida")
        return
    
    print("🔄 Iniciando migração de SQLite para PostgreSQL...")
    print(f"   SQLite: {sqlite_url}")
    print(f"   PostgreSQL: {postgres_url.split('@')[1] if '@' in postgres_url else 'oculto'}")
    
    # Conectar ao SQLite
    sqlite_path = sqlite_url.replace('sqlite:///', '')
    if not os.path.exists(sqlite_path):
        print(f"❌ Erro: Arquivo SQLite não encontrado: {sqlite_path}")
        return
    
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    
    # Configurar Flask com PostgreSQL
    app.config['SQLALCHEMY_DATABASE_URI'] = postgres_url
    db.init_app(app)
    
    with app.app_context():
        # Verificar se as tabelas existem no PostgreSQL
        try:
            db.create_all()
            print("✓ Tabelas criadas no PostgreSQL")
        except Exception as e:
            print(f"⚠ Aviso ao criar tabelas: {e}")
            print("   Certifique-se de que as migrações foram executadas: alembic upgrade head")
        
        # Migrar dados
        tables = [
            ('usuarios', User),
            ('categorias_financeiras', CategoriaFinanceira),
            ('projetos', Projeto),
            ('cenarios', Cenario),
            ('lancamentos_financeiros', LancamentoFinanceiro),
            ('arquivos_upload', ArquivoUpload),
            ('configuracoes_cenarios', ConfiguracaoCenarios),
            ('logs_sistema', LogSistema),
            ('historico_cenarios', HistoricoCenario),
        ]
        
        total_migrated = 0
        
        for table_name, model_class in tables:
            try:
                # Ler dados do SQLite
                cursor = sqlite_conn.execute(f'SELECT * FROM {table_name}')
                rows = cursor.fetchall()
                
                if not rows:
                    print(f"ℹ {table_name}: Nenhum dado para migrar")
                    continue
                
                # Migrar para PostgreSQL
                migrated_count = 0
                for row in rows:
                    row_dict = dict(row)
                    
                    # Verificar se já existe (evitar duplicatas)
                    if hasattr(model_class, 'id'):
                        existing = model_class.query.filter_by(id=row_dict.get('id')).first()
                        if existing:
                            continue
                    
                    # Criar instância do modelo
                    try:
                        instance = model_class(**row_dict)
                        db.session.add(instance)
                        migrated_count += 1
                    except Exception as e:
                        print(f"⚠ Erro ao migrar registro de {table_name}: {e}")
                        continue
                
                db.session.commit()
                print(f"✓ {table_name}: {migrated_count} registros migrados")
                total_migrated += migrated_count
                
            except Exception as e:
                print(f"❌ Erro ao migrar {table_name}: {e}")
                db.session.rollback()
                continue
        
        sqlite_conn.close()
        
        print(f"\n✅ Migração concluída! Total: {total_migrated} registros migrados")
        print("\n⚠ Importante:")
        print("   1. Verifique os dados migrados no PostgreSQL")
        print("   2. Teste a aplicação com o novo banco")
        print("   3. Faça backup do SQLite antes de desativá-lo")
        print("   4. Atualize o .env para usar apenas PostgreSQL")

if __name__ == '__main__':
    migrate_sqlite_to_postgres()

