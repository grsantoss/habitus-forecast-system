#!/bin/bash
# Script para build do frontend para produção
# Execute: bash frontend/build.sh

cd "$(dirname "$0")"

echo "🔄 Instalando dependências..."
pnpm install

echo "🔄 Construindo aplicação para produção..."
pnpm run build

echo "✅ Build concluído!"
echo "📁 Arquivos gerados em: ../backend/src/static/"

