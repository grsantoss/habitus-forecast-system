#!/bin/bash
# Script para executar migrações do banco de dados
# Uso: ./scripts/run_migration.sh

echo "🔄 Executando migrações do banco de dados..."

# Navegar para o diretório backend
cd "$(dirname "$0")/.."

# Executar migração
python -m alembic -c migrations/alembic.ini upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Migrações executadas com sucesso!"
else
    echo "❌ Erro ao executar migrações"
    exit 1
fi

