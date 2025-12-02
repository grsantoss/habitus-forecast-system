#!/bin/bash
# Script para build completo da aplicação com Docker
# Execute: bash scripts/docker-build.sh

set -e

echo "🐳 Building Habitus Forecast com Docker..."

# Build do frontend primeiro
echo "📦 Building frontend..."
cd frontend
docker build -t habitus-frontend:builder --target builder -f Dockerfile .
docker run --rm -v "$(pwd)/../backend/src/static:/output" habitus-frontend:builder sh -c "cp -r dist/* /output/"
cd ..

# Build do backend
echo "📦 Building backend..."
cd backend
docker build -t habitus-backend:latest -f Dockerfile .
cd ..

echo "✅ Build concluído!"
echo ""
echo "Para iniciar:"
echo "  docker-compose up -d"

