#!/bin/bash
# Script para corrigir deploy do frontend no servidor
# Resolve conflitos de git pull e atualiza frontend

set -e

echo "🔧 Corrigindo deploy do frontend..."

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

echo -e "${CYAN}📋 Passo 1: Fazendo backup dos arquivos conflitantes...${NC}"
BACKUP_DIR="backend/src/static_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Fazer backup dos arquivos que estão causando conflito
if [ -d "backend/src/static/assets" ]; then
    cp -r backend/src/static/assets "$BACKUP_DIR/" 2>/dev/null || true
    echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"
fi

echo -e "${CYAN}📋 Passo 2: Removendo arquivos conflitantes...${NC}"
# Remover arquivos não rastreados que estão causando conflito
rm -f "backend/src/static/assets/favicon habitus forecast-sSShFcmp.svg" 2>/dev/null || true
rm -f "backend/src/static/assets/habitus forecast_v2-BSD36CHs.svg" 2>/dev/null || true
rm -f "backend/src/static/assets/habitus-forecast-login-CCRypjXp.svg" 2>/dev/null || true
rm -f "backend/src/static/assets/index-FZHGDF85.css" 2>/dev/null || true
rm -f "backend/src/static/assets/react-vendor-D-qr47TU.js" 2>/dev/null || true
rm -f "backend/src/static/assets/ui-vendor-59umdV3U.js" 2>/dev/null || true

echo -e "${CYAN}📋 Passo 3: Fazendo git pull...${NC}"
git pull origin prod-deploy-guide-ac7ef

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer git pull${NC}"
    echo -e "${YELLOW}⚠️  Tentando resetar arquivos locais...${NC}"
    git reset --hard HEAD
    git pull origin prod-deploy-guide-ac7ef
fi

echo -e "${CYAN}📋 Passo 4: Verificando se index.html foi atualizado...${NC}"
if grep -q "Habitus Foreca" backend/src/static/index.html 2>/dev/null; then
    echo -e "${GREEN}✅ index.html atualizado corretamente!${NC}"
    head -10 backend/src/static/index.html
else
    echo -e "${RED}❌ index.html ainda está com conteúdo antigo${NC}"
    echo -e "${YELLOW}⚠️  Tentando fazer build do frontend no servidor...${NC}"
    
    # Verificar se Node.js está instalado
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️  Node.js não encontrado. Instalando...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # Verificar se pnpm está instalado
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠️  pnpm não encontrado. Instalando...${NC}"
        npm install -g pnpm
    fi
    
    # Fazer build do frontend
    cd frontend
    export BUILD_ENV=production
    export NODE_ENV=production
    export VITE_API_URL=https://app.habitusforecast.com.br/api
    
    echo -e "${CYAN}🔄 Instalando dependências...${NC}"
    pnpm install --frozen-lockfile
    
    echo -e "${CYAN}🔨 Fazendo build...${NC}"
    pnpm run build
    
    cd ..
    
    # Verificar novamente
    if grep -q "Habitus Foreca" backend/src/static/index.html 2>/dev/null; then
        echo -e "${GREEN}✅ Build concluído! index.html atualizado.${NC}"
    else
        echo -e "${RED}❌ Erro: Build não atualizou index.html corretamente${NC}"
        exit 1
    fi
fi

echo -e "${CYAN}📋 Passo 5: Verificando assets...${NC}"
if [ -d "backend/src/static/assets" ] && [ "$(ls -A backend/src/static/assets 2>/dev/null)" ]; then
    echo -e "${GREEN}✅ Assets encontrados:${NC}"
    ls -lh backend/src/static/assets/ | head -10
else
    echo -e "${YELLOW}⚠️  Assets não encontrados ou diretório vazio${NC}"
fi

echo -e "${CYAN}📋 Passo 6: Recarregando Nginx...${NC}"
systemctl reload nginx || service nginx reload

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx recarregado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao recarregar Nginx${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deploy do frontend corrigido com sucesso!${NC}"
echo -e "${CYAN}🌐 Teste acessando: https://app.habitusforecast.com.br${NC}"
echo ""
echo -e "${YELLOW}💡 Backup dos arquivos antigos está em: $BACKUP_DIR${NC}"
echo -e "${YELLOW}   Você pode removê-lo após confirmar que tudo está funcionando.${NC}"

