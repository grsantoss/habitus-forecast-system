#!/bin/bash
# Script para build do frontend em produção no servidor
# Execute: bash scripts/build-frontend-production.sh

set -e

echo "🚀 Iniciando build do frontend para produção..."

# Cores para melhor visualização
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: Execute do diretório raiz do projeto${NC}"
    exit 1
fi

# Verificar se Node.js e pnpm estão instalados
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instalando...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm não encontrado. Instalando...${NC}"
    npm install -g pnpm
fi

# Configurar variáveis de ambiente para produção
export BUILD_ENV=production
export NODE_ENV=production
export VITE_API_URL=https://app.habitusforecast.com.br/api

echo -e "${CYAN}📋 Configuração:${NC}"
echo "   BUILD_ENV: $BUILD_ENV"
echo "   NODE_ENV: $NODE_ENV"
echo "   VITE_API_URL: $VITE_API_URL"

# Ir para o diretório do frontend
cd frontend

echo -e "${CYAN}🔄 Instalando dependências do frontend...${NC}"
pnpm install --frozen-lockfile

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${CYAN}🔨 Construindo aplicação para produção...${NC}"
pnpm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer build${NC}"
    exit 1
fi

# Voltar para o diretório raiz
cd ..

# Verificar se os arquivos foram gerados
if [ -f "backend/src/static/index.html" ]; then
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
    echo -e "${CYAN}📁 Arquivos gerados em: backend/src/static/${NC}"
    
    # Verificar conteúdo do index.html para confirmar que é o frontend React
    if grep -q "Habitus Foreca" backend/src/static/index.html; then
        echo -e "${GREEN}✅ Frontend React detectado no index.html${NC}"
    else
        echo -e "${YELLOW}⚠️  Aviso: index.html pode não ser do frontend React${NC}"
    fi
    
    # Listar arquivos gerados
    echo -e "${CYAN}📊 Arquivos gerados:${NC}"
    ls -lh backend/src/static/ | head -10
    
    echo ""
    echo -e "${CYAN}🔄 Reiniciando Nginx para aplicar mudanças...${NC}"
    systemctl reload nginx || service nginx reload
    
    echo -e "${GREEN}✅ Frontend buildado e Nginx reiniciado!${NC}"
    echo ""
    echo -e "${CYAN}🌐 Teste acessando: https://app.habitusforecast.com.br${NC}"
else
    echo -e "${RED}❌ Erro: Arquivos não foram gerados em backend/src/static/${NC}"
    exit 1
fi

