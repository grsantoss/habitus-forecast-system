#!/bin/bash
# Script para criar a migração inicial do banco de dados
# Execute: bash scripts/create_initial_migration.sh

cd "$(dirname "$0")/.."

echo "🔄 Criando migração inicial..."

# Verificar se Alembic está instalado
python -c "import alembic" 2>/dev/null || {
    echo "❌ Alembic não está instalado. Execute: pip install -r requirements.txt"
    exit 1
}

# Criar migração inicial
alembic revision --autogenerate -m "Initial migration"

echo "✅ Migração inicial criada!"
echo ""
echo "Próximos passos:"
echo "1. Revise o arquivo de migração em migrations/versions/"
echo "2. Execute: alembic upgrade head"
echo "3. Execute: python scripts/seed_db.py"

