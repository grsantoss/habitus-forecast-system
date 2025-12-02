#!/bin/bash
# Script para iniciar ambiente de desenvolvimento com Docker
# Execute: bash scripts/docker-dev.sh

set -e

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Docker Compose Environment
POSTGRES_DB=habitus_forecast
POSTGRES_USER=habitus
POSTGRES_PASSWORD=habitus123
POSTGRES_PORT=5432

# Backend
SECRET_KEY=dev-secret-key-change-in-production
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
WORKERS=2
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://localhost:5173

# Frontend
FRONTEND_PORT=5173
EOF
    echo "✅ Arquivo .env criado. Configure as variáveis se necessário."
fi

# Build e iniciar serviços
echo "🐳 Iniciando containers..."
docker-compose up -d --build

echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Executar migrações
echo "🔄 Executando migrações..."
docker-compose exec backend alembic upgrade head

# Popular dados iniciais
echo "🌱 Populando dados iniciais..."
docker-compose exec backend python scripts/seed_db.py

echo ""
echo "✅ Ambiente de desenvolvimento iniciado!"
echo ""
echo "Serviços disponíveis:"
echo "  - Backend API: http://localhost:5000"
echo "  - Frontend Dev: http://localhost:5173 (se habilitado)"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Parar: docker-compose down"
echo "  - Rebuild: docker-compose up -d --build"

