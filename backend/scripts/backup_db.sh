#!/bin/bash
# Script de backup automático do PostgreSQL
# Execute via cron: 0 2 * * * /path/to/backup_db.sh

set -e

# Carregar variáveis de ambiente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env" 2>/dev/null || true

# Configurações
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Extrair informações do DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não configurado"
    exit 1
fi

# Parse DATABASE_URL (postgresql://user:pass@host:port/dbname)
DB_URL=$(echo "$DATABASE_URL" | sed 's|postgresql://||')
DB_USER=$(echo "$DB_URL" | cut -d: -f1)
DB_PASS=$(echo "$DB_URL" | cut -d: -f2 | cut -d@ -f1)
DB_HOST=$(echo "$DB_URL" | cut -d@ -f2 | cut -d: -f1)
DB_PORT=$(echo "$DB_URL" | cut -d: -f3 | cut -d/ -f1)
DB_NAME=$(echo "$DB_URL" | cut -d/ -f2)

# Nome do arquivo de backup
BACKUP_FILE="$BACKUP_DIR/habitus_forecast_${TIMESTAMP}.sql.gz"

# Fazer backup
echo "🔄 Fazendo backup do banco de dados..."
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup criado: $BACKUP_FILE"
    
    # Remover backups antigos
    echo "🧹 Removendo backups antigos (mais de $RETENTION_DAYS dias)..."
    find "$BACKUP_DIR" -name "habitus_forecast_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Opcional: Upload para S3 ou outro storage
    if [ -n "$BACKUP_S3_BUCKET" ]; then
        echo "☁️ Enviando para S3..."
        aws s3 cp "$BACKUP_FILE" "s3://$BACKUP_S3_BUCKET/" || echo "⚠️ Falha ao enviar para S3"
    fi
else
    echo "❌ Erro ao criar backup"
    exit 1
fi

