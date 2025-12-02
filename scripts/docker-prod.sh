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
pnpm install
pnpm run build
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

