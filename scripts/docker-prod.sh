#!/bin/bash
# Script para deploy em produção com Docker
# Execute: bash scripts/docker-prod.sh

set -e

echo "🚀 Deploy em produção..."

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "   Crie o arquivo .env com as configurações de produção"
    exit 1
fi

# Build do frontend
echo "📦 Building frontend..."
cd frontend

# Configurar ambiente de produção para validação
export BUILD_ENV=production
export NODE_ENV=production

# Verificar se VITE_API_URL está configurada (build.sh vai validar)
if [ -z "$VITE_API_URL" ]; then
    echo "❌ ERRO: VITE_API_URL não configurada para produção!" >&2
    echo "" >&2
    echo "   Configure no arquivo .env do projeto raiz:" >&2
    echo "   VITE_API_URL=https://app.habitusforecast.com.br/api" >&2
    echo "" >&2
    exit 1
fi

# Executar build (que vai validar VITE_API_URL)
bash build.sh
cd ..

# Build das imagens Docker
echo "🐳 Building imagens Docker..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Iniciar novos containers
echo "🚀 Iniciando containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Executar migrações
echo "🔄 Executando migrações..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "Verificar status:"
echo "  docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps"
echo ""
echo "Ver logs:"
echo "  docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"

