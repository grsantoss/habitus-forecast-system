"""Initial migration - create base tables

Revision ID: 0001_initial
Revises: 
Create Date: 2025-12-10 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Verificar tipo de banco de dados
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'
    
    # Verificar se as tabelas já existem
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    
    # Criar tipos ENUM para PostgreSQL
    if is_postgres:
        # user_roles
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'user_roles')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE user_roles AS ENUM ('admin', 'usuario')")
        
        # user_status
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'user_status')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected')")
        
        # tipo_fluxo
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'tipo_fluxo')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE tipo_fluxo AS ENUM ('OPERACIONAL', 'INVESTIMENTO', 'FINANCIAMENTO')")
        
        # tipo_lancamento
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'tipo_lancamento')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE tipo_lancamento AS ENUM ('ENTRADA', 'SAIDA')")
        
        # origem_lancamento
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'origem_lancamento')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE origem_lancamento AS ENUM ('PROJETADO', 'REALIZADO')")
        
        # status_processamento
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'status_processamento')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE status_processamento AS ENUM ('pendente', 'processado', 'erro')")
        
        # Definir ENUMs para uso nas tabelas
        user_roles_enum = postgresql.ENUM('admin', 'usuario', name='user_roles', create_type=False)
        user_status_enum = postgresql.ENUM('pending', 'active', 'rejected', name='user_status', create_type=False)
        tipo_fluxo_enum = postgresql.ENUM('OPERACIONAL', 'INVESTIMENTO', 'FINANCIAMENTO', name='tipo_fluxo', create_type=False)
        tipo_lancamento_enum = postgresql.ENUM('ENTRADA', 'SAIDA', name='tipo_lancamento', create_type=False)
        origem_lancamento_enum = postgresql.ENUM('PROJETADO', 'REALIZADO', name='origem_lancamento', create_type=False)
        status_processamento_enum = postgresql.ENUM('pendente', 'processado', 'erro', name='status_processamento', create_type=False)
    else:
        # Para SQLite, usar String
        user_roles_enum = sa.String(20)
        user_status_enum = sa.String(20)
        tipo_fluxo_enum = sa.String(20)
        tipo_lancamento_enum = sa.String(20)
        origem_lancamento_enum = sa.String(20)
        status_processamento_enum = sa.String(20)
    
    # Criar tabela usuarios
    if 'usuarios' not in tables:
        op.create_table(
            'usuarios',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('nome', sa.String(length=255), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('senha_hash', sa.String(length=255), nullable=False),
            sa.Column('role', user_roles_enum, nullable=False, server_default='usuario'),
            sa.Column('status', user_status_enum, nullable=False, server_default='pending'),
            sa.Column('telefone', sa.String(length=20), nullable=True),
            sa.Column('empresa', sa.String(length=255), nullable=True),
            sa.Column('cnpj', sa.String(length=20), nullable=True),
            sa.Column('cargo', sa.String(length=100), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('email')
        )
        if not is_postgres:
            op.create_check_constraint('ck_usuarios_role', 'usuarios', "role IN ('admin', 'usuario')")
            op.create_check_constraint('ck_usuarios_status', 'usuarios', "status IN ('pending', 'active', 'rejected')")
    
    # Criar tabela categorias_financeiras
    if 'categorias_financeiras' not in tables:
        op.create_table(
            'categorias_financeiras',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('nome', sa.String(length=255), nullable=False),
            sa.Column('categoria_pai_id', sa.Integer(), nullable=True),
            sa.Column('tipo_fluxo', tipo_fluxo_enum, nullable=False),
            sa.ForeignKeyConstraint(['categoria_pai_id'], ['categorias_financeiras.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('nome')
        )
        if not is_postgres:
            op.create_check_constraint('ck_categorias_tipo_fluxo', 'categorias_financeiras', "tipo_fluxo IN ('OPERACIONAL', 'INVESTIMENTO', 'FINANCIAMENTO')")
    
    # Criar tabela projetos
    if 'projetos' not in tables:
        op.create_table(
            'projetos',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('usuario_id', sa.Integer(), nullable=False),
            sa.Column('nome_cliente', sa.String(length=255), nullable=False),
            sa.Column('data_base_estudo', sa.Date(), nullable=False),
            sa.Column('saldo_inicial_caixa', sa.Numeric(precision=15, scale=2), nullable=False),
            sa.Column('ponto_equilibrio', sa.Numeric(precision=15, scale=2), nullable=True),
            sa.Column('geracao_fdc_livre', sa.Numeric(precision=15, scale=2), nullable=True),
            sa.Column('percentual_custo_fixo', sa.Numeric(precision=7, scale=2), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # Criar tabela cenarios
    if 'cenarios' not in tables:
        op.create_table(
            'cenarios',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('projeto_id', sa.Integer(), nullable=False),
            sa.Column('nome', sa.String(length=100), nullable=False),
            sa.Column('descricao', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True, server_default='false'),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['projeto_id'], ['projetos.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # Criar tabela lancamentos_financeiros
    if 'lancamentos_financeiros' not in tables:
        op.create_table(
            'lancamentos_financeiros',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('cenario_id', sa.Integer(), nullable=False),
            sa.Column('categoria_id', sa.Integer(), nullable=False),
            sa.Column('data_competencia', sa.Date(), nullable=False),
            sa.Column('valor', sa.Numeric(precision=15, scale=2), nullable=False),
            sa.Column('tipo', tipo_lancamento_enum, nullable=False),
            sa.Column('origem', origem_lancamento_enum, nullable=False, server_default='PROJETADO'),
            sa.ForeignKeyConstraint(['cenario_id'], ['cenarios.id'], ),
            sa.ForeignKeyConstraint(['categoria_id'], ['categorias_financeiras.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        if not is_postgres:
            op.create_check_constraint('ck_lancamentos_tipo', 'lancamentos_financeiros', "tipo IN ('ENTRADA', 'SAIDA')")
            op.create_check_constraint('ck_lancamentos_origem', 'lancamentos_financeiros', "origem IN ('PROJETADO', 'REALIZADO')")
    
    # Criar tabela arquivos_upload
    if 'arquivos_upload' not in tables:
        op.create_table(
            'arquivos_upload',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('projeto_id', sa.Integer(), nullable=False),
            sa.Column('nome_original', sa.String(length=255), nullable=False),
            sa.Column('caminho_storage', sa.String(length=512), nullable=False),
            sa.Column('hash_arquivo', sa.String(length=255), nullable=False),
            sa.Column('status_processamento', status_processamento_enum, nullable=True, server_default='pendente'),
            sa.Column('relatorio_processamento', sa.JSON(), nullable=True),
            sa.Column('uploaded_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['projeto_id'], ['projetos.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        if not is_postgres:
            op.create_check_constraint('ck_arquivos_status', 'arquivos_upload', "status_processamento IN ('pendente', 'processado', 'erro')")
    
    # Criar tabela configuracoes_cenarios
    if 'configuracoes_cenarios' not in tables:
        op.create_table(
            'configuracoes_cenarios',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('usuario_id', sa.Integer(), nullable=False),
            sa.Column('pessimista', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
            sa.Column('realista', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
            sa.Column('otimista', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
            sa.Column('agressivo', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # Criar tabela logs_sistema
    if 'logs_sistema' not in tables:
        op.create_table(
            'logs_sistema',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('usuario_id', sa.Integer(), nullable=True),
            sa.Column('acao', sa.String(length=255), nullable=False),
            sa.Column('detalhes', sa.JSON(), nullable=True),
            sa.Column('timestamp', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
    
    # Criar tabela historico_cenarios
    if 'historico_cenarios' not in tables:
        op.create_table(
            'historico_cenarios',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('cenario_id', sa.Integer(), nullable=False),
            sa.Column('usuario_id', sa.Integer(), nullable=False),
            sa.Column('descricao', sa.String(length=255), nullable=True),
            sa.Column('snapshot_data', sa.JSON(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['cenario_id'], ['cenarios.id'], ),
            sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    # Remover tabelas na ordem inversa (respeitando foreign keys)
    op.drop_table('historico_cenarios')
    op.drop_table('logs_sistema')
    op.drop_table('configuracoes_cenarios')
    op.drop_table('arquivos_upload')
    op.drop_table('lancamentos_financeiros')
    op.drop_table('cenarios')
    op.drop_table('projetos')
    op.drop_table('categorias_financeiras')
    op.drop_table('usuarios')
    
    # Remover tipos ENUM (apenas PostgreSQL)
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'
    if is_postgres:
        op.execute("DROP TYPE IF EXISTS status_processamento")
        op.execute("DROP TYPE IF EXISTS origem_lancamento")
        op.execute("DROP TYPE IF EXISTS tipo_lancamento")
        op.execute("DROP TYPE IF EXISTS tipo_fluxo")
        op.execute("DROP TYPE IF EXISTS user_status")
        op.execute("DROP TYPE IF EXISTS user_roles")

