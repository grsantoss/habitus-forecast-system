#!/bin/bash
# Script de backup do banco de dados PostgreSQL
# Execute: bash scripts/backup-db.sh

set -e

# Variáveis
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILES="docker-compose.yml docker-compose.prod.yml"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/habitus_forecast_$TIMESTAMP.sql"

echo "📦 Fazendo backup do banco de dados..."

# Fazer backup
docker-compose -f $COMPOSE_FILES exec -T db pg_dump -U ${POSTGRES_USER:-habitus} ${POSTGRES_DB:-habitus_forecast} > "$BACKUP_FILE"

# Comprimir backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ Backup criado: $BACKUP_FILE"

# Manter apenas últimos 7 backups
echo "🧹 Limpando backups antigos (mantendo últimos 7)..."
ls -t "$BACKUP_DIR"/habitus_forecast_*.sql.gz | tail -n +8 | xargs rm -f || true

echo "✨ Backup concluído!"

