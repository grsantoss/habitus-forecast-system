"""Add token_blacklist table

Revision ID: b2c3d4e5f6a7
Revises: ac814967bae3
Create Date: 2025-12-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'ac814967bae3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Verificar tipo de banco de dados
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'
    
    # Verificar se a tabela já existe
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    
    if 'token_blacklist' in tables:
        # Tabela já existe, apenas adicionar índices se não existirem
        indexes = [idx['name'] for idx in inspector.get_indexes('token_blacklist')]
        
        if 'ix_token_blacklist_token' not in indexes:
            op.create_index('ix_token_blacklist_token', 'token_blacklist', ['token'], unique=True)
        if 'ix_token_blacklist_created_at' not in indexes:
            op.create_index('ix_token_blacklist_created_at', 'token_blacklist', ['created_at'], unique=False)
        return
    
    # Criar tabela token_blacklist
    op.create_table(
        'token_blacklist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=500), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Adicionar índice único no token para busca rápida
    op.create_index('ix_token_blacklist_token', 'token_blacklist', ['token'], unique=True)
    # Adicionar índice em created_at para limpeza periódica de tokens antigos
    op.create_index('ix_token_blacklist_created_at', 'token_blacklist', ['created_at'], unique=False)


def downgrade() -> None:
    # Remover índices
    op.drop_index('ix_token_blacklist_created_at', table_name='token_blacklist')
    op.drop_index('ix_token_blacklist_token', table_name='token_blacklist')
    
    # Remover tabela
    op.drop_table('token_blacklist')

