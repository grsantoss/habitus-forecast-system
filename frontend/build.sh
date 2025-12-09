#!/bin/bash
# Script para build do frontend para produção
# Execute: bash frontend/build.sh

set -e  # Falhar em caso de erro

cd "$(dirname "$0")"

# Detectar se estamos em produção
# Se NODE_ENV=production ou BUILD_ENV=production, validar VITE_API_URL
BUILD_ENV="${BUILD_ENV:-${NODE_ENV:-development}}"
IS_PRODUCTION=false

if [ "$BUILD_ENV" = "production" ] || [ "$BUILD_ENV" = "prod" ]; then
    IS_PRODUCTION=true
fi

echo "🔄 Instalando dependências..."
pnpm install

# Validar VITE_API_URL em produção
if [ "$IS_PRODUCTION" = "true" ]; then
    if [ -z "$VITE_API_URL" ]; then
        echo "❌ ERRO: VITE_API_URL não configurada para produção!" >&2
        echo "" >&2
        echo "   Configure a variável de ambiente VITE_API_URL antes do build:" >&2
        echo "   export VITE_API_URL=https://app.habitusforecast.com.br/api" >&2
        echo "" >&2
        echo "   Ou configure no arquivo .env do projeto raiz:" >&2
        echo "   VITE_API_URL=https://app.habitusforecast.com.br/api" >&2
        exit 1
    fi
    
    # Validar que não está usando localhost em produção
    if echo "$VITE_API_URL" | grep -q "localhost\|127.0.0.1"; then
        echo "❌ ERRO: VITE_API_URL não pode apontar para localhost em produção!" >&2
        echo "   Valor atual: $VITE_API_URL" >&2
        echo "   Configure uma URL de produção válida." >&2
        exit 1
    fi
    
    echo "✅ VITE_API_URL validada: $VITE_API_URL"
else
    # Em desenvolvimento, apenas avisar se não estiver configurada
    if [ -z "$VITE_API_URL" ]; then
        echo "⚠️  VITE_API_URL não configurada!"
        echo "   Usando valor padrão: http://localhost:5000/api"
        echo "   Para produção, configure VITE_API_URL antes do build"
    else
        echo "ℹ️  VITE_API_URL configurada: $VITE_API_URL"
    fi
fi

echo "🔄 Construindo aplicação para produção..."
pnpm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído!"
    echo "📁 Arquivos gerados em: ../backend/src/static/"
else
    echo "❌ Erro ao fazer build" >&2
    exit 1
fi

