#!/bin/bash
# Script para corrigir migration com verificação de tipos ENUM
# Execute: bash scripts/fix-migration-enum.sh

set -e

MIGRATION_FILE="backend/migrations/versions/ac814967bae3_add_relatorios_table.py"
BACKUP_FILE="${MIGRATION_FILE}.backup"

echo "🔧 Verificando migration..."

# Verificar se arquivo existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Arquivo de migration não encontrado: $MIGRATION_FILE"
    exit 1
fi

# Verificar se já tem a correção
if grep -q "SELECT EXISTS(SELECT 1 FROM pg_type" "$MIGRATION_FILE"; then
    echo "✅ Migration já está corrigida!"
    exit 0
fi

echo "⚠️  Migration precisa de correção"
echo "   Execute: git pull para atualizar com versão corrigida"

