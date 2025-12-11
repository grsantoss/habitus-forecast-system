#!/bin/bash
# Script para corrigir deploy em produção
# Execute no servidor: bash scripts/fix-production-deploy.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔧 Corrigindo Deploy em Produção - Habitus Forecast${NC}"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: Execute do diretório raiz do projeto${NC}"
    exit 1
fi

# Passo 1: Parar containers
echo -e "${CYAN}Passo 1/5: Parando containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
echo -e "${GREEN}✅ Containers parados${NC}"
echo ""

# Passo 2: Remover volume PostgreSQL
echo -e "${CYAN}Passo 2/5: Removendo volume PostgreSQL com credenciais antigas...${NC}"
docker volume ls | grep postgres
if docker volume rm habitus-forecast-system_postgres_data 2>/dev/null; then
    echo -e "${GREEN}✅ Volume removido${NC}"
else
    echo -e "${YELLOW}⚠️  Volume já estava removido ou não existe${NC}"
fi
echo ""

# Passo 3: Rebuild backend
echo -e "${CYAN}Passo 3/5: Reconstruindo imagem backend (sem cache)...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache backend
echo -e "${GREEN}✅ Imagem reconstruída${NC}"
echo ""

# Passo 4: Iniciar containers
echo -e "${CYAN}Passo 4/5: Iniciando containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo -e "${GREEN}✅ Containers iniciados${NC}"
echo ""

# Passo 5: Aguardar e verificar
echo -e "${CYAN}Passo 5/5: Aguardando inicialização...${NC}"
sleep 20

echo ""
echo -e "${CYAN}📊 Verificando status dos containers:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo -e "${CYAN}📋 Últimas 50 linhas do log do backend:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend | tail -50

echo ""
echo -e "${CYAN}🔍 Verificando variável SKIP_DB_INIT:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend env | grep SKIP_DB_INIT || echo -e "${RED}❌ Variável não encontrada${NC}"

echo ""
echo -e "${CYAN}🏥 Testando health check:${NC}"
if curl -f http://localhost:5000/api/health 2>/dev/null; then
    echo -e "${GREEN}✅ API está respondendo!${NC}"
else
    echo -e "${RED}❌ API não está respondendo${NC}"
    echo -e "${YELLOW}   Verifique os logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Script concluído!${NC}"
echo "=========================================="

