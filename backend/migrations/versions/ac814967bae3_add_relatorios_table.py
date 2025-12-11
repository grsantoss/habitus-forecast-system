"""Add relatorios table

Revision ID: ac814967bae3
Revises: 0001_initial
Create Date: 2025-12-08 15:06:46.697022

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ac814967bae3'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Verificar tipo de banco de dados
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'
    
    # Verificar se a tabela já existe
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    
    if 'relatorios' in tables:
        # Tabela já existe, apenas adicionar índices e constraints se não existirem
        indexes = [idx['name'] for idx in inspector.get_indexes('relatorios')]
        
        if 'ix_relatorios_usuario_id' not in indexes:
            op.create_index('ix_relatorios_usuario_id', 'relatorios', ['usuario_id'], unique=False)
        if 'ix_relatorios_scenario_id' not in indexes:
            op.create_index('ix_relatorios_scenario_id', 'relatorios', ['scenario_id'], unique=False)
        if 'ix_relatorios_created_at' not in indexes:
            op.create_index('ix_relatorios_created_at', 'relatorios', ['created_at'], unique=False)
        
        # Adicionar constraints CHECK para SQLite se não existirem
        if not is_postgres:
            constraints = [c['name'] for c in inspector.get_check_constraints('relatorios')]
            if 'ck_relatorios_type' not in constraints:
                try:
                    op.create_check_constraint('ck_relatorios_type', 'relatorios', "type IN ('pdf', 'excel')")
                except:
                    pass
            if 'ck_relatorios_template' not in constraints:
                try:
                    op.create_check_constraint('ck_relatorios_template', 'relatorios', "template IN ('executive', 'detailed', 'comparison')")
                except:
                    pass
            if 'ck_relatorios_status' not in constraints:
                try:
                    op.create_check_constraint('ck_relatorios_status', 'relatorios', "status IN ('completed', 'scheduled')")
                except:
                    pass
        return
    
    # Criar tipos ENUM para PostgreSQL (SQLite não suporta ENUM nativo)
    if is_postgres:
        # Verificar e criar tipos ENUM apenas se não existirem
        # Verificar se report_type existe
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'report_type')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE report_type AS ENUM ('pdf', 'excel')")
        
        # Verificar se report_template existe
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'report_template')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE report_template AS ENUM ('executive', 'detailed', 'comparison')")
        
        # Verificar se report_status existe
        result = bind.execute(sa.text(
            "SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'report_status')"
        ))
        if not result.scalar():
            op.execute("CREATE TYPE report_status AS ENUM ('completed', 'scheduled')")
        
        # Usar postgresql.ENUM diretamente com create_type=False
        # Os tipos já foram criados manualmente acima, então não tentar criar novamente
        # Usar postgresql.ENUM evita o evento _on_table_create que tenta criar tipos
        report_type_enum = postgresql.ENUM('pdf', 'excel', name='report_type', create_type=False)
        report_template_enum = postgresql.ENUM('executive', 'detailed', 'comparison', name='report_template', create_type=False)
        report_status_enum = postgresql.ENUM('completed', 'scheduled', name='report_status', create_type=False)
    else:
        # Para SQLite, usar String com constraint CHECK
        report_type_enum = sa.String(50)
        report_template_enum = sa.String(50)
        report_status_enum = sa.String(50)
    
    # Criar tabela relatorios
    op.create_table(
        'relatorios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('type', report_type_enum, nullable=False),
        sa.Column('template', report_template_enum, nullable=False),
        sa.Column('scenario', sa.String(length=255), nullable=True),
        sa.Column('scenario_id', sa.Integer(), nullable=True),
        sa.Column('scenario_ids', sa.JSON(), nullable=True),
        sa.Column('size', sa.String(length=50), nullable=True),
        sa.Column('pages', sa.Integer(), nullable=True),
        sa.Column('sheets', sa.Integer(), nullable=True),
        sa.Column('downloads', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('status', report_status_enum, nullable=True, server_default='completed'),
        sa.Column('periodo', sa.String(length=50), nullable=True, server_default='todos'),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
        sa.ForeignKeyConstraint(['scenario_id'], ['cenarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Adicionar constraints CHECK para SQLite (validação de ENUMs)
    if not is_postgres:
        op.create_check_constraint(
            'ck_relatorios_type',
            'relatorios',
            "type IN ('pdf', 'excel')"
        )
        op.create_check_constraint(
            'ck_relatorios_template',
            'relatorios',
            "template IN ('executive', 'detailed', 'comparison')"
        )
        op.create_check_constraint(
            'ck_relatorios_status',
            'relatorios',
            "status IN ('completed', 'scheduled')"
        )
    
    # Adicionar índices para melhor performance
    op.create_index('ix_relatorios_usuario_id', 'relatorios', ['usuario_id'], unique=False)
    op.create_index('ix_relatorios_scenario_id', 'relatorios', ['scenario_id'], unique=False)
    op.create_index('ix_relatorios_created_at', 'relatorios', ['created_at'], unique=False)


def downgrade() -> None:
    # Verificar tipo de banco de dados
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'
    
    # Remover índices
    op.drop_index('ix_relatorios_created_at', table_name='relatorios')
    op.drop_index('ix_relatorios_scenario_id', table_name='relatorios')
    op.drop_index('ix_relatorios_usuario_id', table_name='relatorios')
    
    # Remover constraints CHECK (apenas SQLite)
    if not is_postgres:
        try:
            op.drop_constraint('ck_relatorios_status', 'relatorios', type_='check')
            op.drop_constraint('ck_relatorios_template', 'relatorios', type_='check')
            op.drop_constraint('ck_relatorios_type', 'relatorios', type_='check')
        except:
            pass  # Ignorar se não existir
    
    # Remover tabela
    op.drop_table('relatorios')
    
    # Remover tipos ENUM (apenas PostgreSQL)
    if is_postgres:
        op.execute("DROP TYPE IF EXISTS report_status")
        op.execute("DROP TYPE IF EXISTS report_template")
        op.execute("DROP TYPE IF EXISTS report_type")

