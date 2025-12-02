#!/bin/bash
# Script de deploy manual no servidor
# Execute: bash scripts/deploy-server.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
APP_DIR="${APP_DIR:-$(pwd)}"
COMPOSE_FILES="docker-compose.yml docker-compose.prod.yml"

echo -e "${GREEN}🚀 Iniciando deploy manual...${NC}"

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.yml não encontrado${NC}"
    echo "Execute este script do diretório raiz do projeto"
    exit 1
fi

# Backup do banco
echo -e "${YELLOW}📦 Fazendo backup do banco de dados...${NC}"
docker-compose -f $COMPOSE_FILES exec -T db pg_dump -U ${POSTGRES_USER:-habitus} ${POSTGRES_DB:-habitus_forecast} > backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo -e "${YELLOW}⚠️ Backup não disponível${NC}"

# Atualizar código
echo -e "${YELLOW}📥 Atualizando código do Git...${NC}"
git fetch origin
git pull origin main || git pull origin master

# Verificar se há mudanças no frontend
if git diff HEAD~1 --name-only | grep -q "frontend/"; then
    echo -e "${YELLOW}🔨 Rebuild do frontend necessário...${NC}"
    cd frontend
    pnpm install --frozen-lockfile
    pnpm run build
    cd ..
fi

# Pull de imagens (se usando registry)
echo -e "${YELLOW}🐳 Atualizando imagens Docker...${NC}"
docker-compose -f $COMPOSE_FILES pull || echo -e "${YELLOW}⚠️ Pull falhou, usando build local${NC}"

# Build e restart
echo -e "${YELLOW}🔨 Construindo e reiniciando containers...${NC}"
docker-compose -f $COMPOSE_FILES up -d --build

# Aguardar backend
echo -e "${YELLOW}⏳ Aguardando backend estar pronto...${NC}"
sleep 15

# Migrações
echo -e "${YELLOW}🗄️ Executando migrações...${NC}"
docker-compose -f $COMPOSE_FILES exec -T backend alembic upgrade head || echo -e "${YELLOW}⚠️ Migrações falharam${NC}"

# Health check
echo -e "${YELLOW}🏥 Verificando saúde da aplicação...${NC}"
sleep 5
if docker-compose -f $COMPOSE_FILES exec -T backend curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
else
    echo -e "${RED}❌ Health check falhou${NC}"
    echo "Verifique os logs: docker-compose -f $COMPOSE_FILES logs backend"
    exit 1
fi

# Limpar imagens antigas
echo -e "${YELLOW}🧹 Limpando imagens antigas...${NC}"
docker image prune -f

echo -e "${GREEN}✨ Deploy finalizado!${NC}"

