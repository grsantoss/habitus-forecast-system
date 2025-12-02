#!/bin/bash
# Script para restaurar backup do PostgreSQL
# Uso: ./restore_db.sh <arquivo_backup>

set -e

if [ -z "$1" ]; then
    echo "Uso: $0 <arquivo_backup.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

# Carregar variáveis de ambiente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não configurado"
    exit 1
fi

# Parse DATABASE_URL
DB_URL=$(echo "$DATABASE_URL" | sed 's|postgresql://||')
DB_USER=$(echo "$DB_URL" | cut -d: -f1)
DB_PASS=$(echo "$DB_URL" | cut -d: -f2 | cut -d@ -f1)
DB_HOST=$(echo "$DB_URL" | cut -d@ -f2 | cut -d: -f1)
DB_PORT=$(echo "$DB_URL" | cut -d: -f3 | cut -d/ -f1)
DB_NAME=$(echo "$DB_URL" | cut -d/ -f2)

echo "⚠️ ATENÇÃO: Isso irá sobrescrever o banco de dados atual!"
read -p "Digite 'RESTORE' para confirmar: " confirm

if [ "$confirm" != "RESTORE" ]; then
    echo "❌ Restore cancelado"
    exit 1
fi

echo "🔄 Restaurando backup..."
export PGPASSWORD="$DB_PASS"

# Descomprimir e restaurar
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME"
else
    psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Backup restaurado com sucesso!"
else
    echo "❌ Erro ao restaurar backup"
    exit 1
fi

