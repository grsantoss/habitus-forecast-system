#!/bin/bash
# Script para executar migrations com tratamento de erros robusto
# Execute: bash backend/scripts/run_migrations.sh

set -e  # Falhar em caso de erro

# Garantir que estamos no diretório correto
cd "$(dirname "$0")/.." || cd /app || {
    echo "❌ ERRO: Não foi possível navegar para o diretório do projeto" >&2
    exit 1
}

echo "🔄 Verificando configuração do Alembic..."
echo "   Diretório atual: $(pwd)"

# Verificar se alembic.ini existe
ALEMBIC_INI="${ALEMBIC_INI:-migrations/alembic.ini}"
if [ ! -f "$ALEMBIC_INI" ]; then
    echo "❌ ERRO: Arquivo alembic.ini não encontrado em: $ALEMBIC_INI" >&2
    echo "   Diretório atual: $(pwd)" >&2
    echo "   Arquivos encontrados:" >&2
    ls -la migrations/ 2>/dev/null || echo "   Diretório migrations não encontrado" >&2
    exit 1
fi

# Verificar se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  AVISO: DATABASE_URL não configurada. Usando SQLite padrão." >&2
fi

echo "🔄 Executando migrations..."
echo "   Arquivo de configuração: $ALEMBIC_INI"
echo "   DATABASE_URL: ${DATABASE_URL:0:30}..." # Mostrar apenas início por segurança

# Executar migrations com retry em caso de falha temporária
MAX_RETRIES=3
RETRY_DELAY=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if alembic -c "$ALEMBIC_INI" upgrade head; then
        echo "✅ Migrations aplicadas com sucesso!"
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "⚠️  Tentativa $RETRY_COUNT/$MAX_RETRIES falhou. Tentando novamente em ${RETRY_DELAY}s..." >&2
            sleep $RETRY_DELAY
        else
            echo "❌ ERRO: Falha ao executar migrations após $MAX_RETRIES tentativas!" >&2
            echo "" >&2
            echo "   Possíveis causas:" >&2
            echo "   - Banco de dados não está acessível" >&2
            echo "   - Credenciais de banco de dados incorretas" >&2
            echo "   - Migrations com erros de sintaxe" >&2
            echo "   - Conflitos de versão do banco de dados" >&2
            echo "" >&2
            echo "   Verifique os logs acima para mais detalhes." >&2
            exit 1
        fi
    fi
done

