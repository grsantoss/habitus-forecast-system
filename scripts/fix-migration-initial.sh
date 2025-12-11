#!/bin/bash
# Script para corrigir migrations criando migration inicial
# Execute: bash scripts/fix-migration-initial.sh

set -e

echo "🚀 Iniciando correção de migrations..."

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

echo -e "${CYAN}📋 Verificando status atual do banco...${NC}"

# Verificar se as tabelas base já existem
TABLES_EXIST=$(docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python -c "
from src.main import app, db
from sqlalchemy import inspect
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    base_tables = ['usuarios', 'projetos', 'cenarios', 'categorias_financeiras']
    if all(t in tables for t in base_tables):
        print('EXISTS')
    else:
        print('EMPTY')
" 2>/dev/null || echo "EMPTY")

echo -e "${CYAN}📊 Status do banco: ${TABLES_EXIST}${NC}"

if [ "$TABLES_EXIST" = "EXISTS" ]; then
    echo -e "${YELLOW}⚠️  Tabelas base já existem. Marcando migrations como aplicadas...${NC}"
    
    # Marcar migration inicial como aplicada
    echo -e "${CYAN}🔄 Marcando migration inicial como aplicada...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend alembic -c migrations/alembic.ini stamp 0001_initial || {
        echo -e "${YELLOW}⚠️  Migration inicial não encontrada, pulando...${NC}"
    }
    
    # Verificar se relatorios existe
    RELATORIOS_EXISTS=$(docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python -c "
from src.main import app, db
from sqlalchemy import inspect
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    if 'relatorios' in tables:
        print('EXISTS')
    else:
        print('NOT_EXISTS')
" 2>/dev/null || echo "NOT_EXISTS")
    
    if [ "$RELATORIOS_EXISTS" = "EXISTS" ]; then
        echo -e "${CYAN}🔄 Marcando migration ac814967bae3 como aplicada...${NC}"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend alembic -c migrations/alembic.ini stamp ac814967bae3 || {
            echo -e "${YELLOW}⚠️  Erro ao marcar migration, continuando...${NC}"
        }
    fi
    
    # Verificar se token_blacklist existe
    TOKEN_EXISTS=$(docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python -c "
from src.main import app, db
from sqlalchemy import inspect
with app.app_context():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    if 'token_blacklist' in tables:
        print('EXISTS')
    else:
        print('NOT_EXISTS')
" 2>/dev/null || echo "NOT_EXISTS")
    
    if [ "$TOKEN_EXISTS" = "EXISTS" ]; then
        echo -e "${CYAN}🔄 Marcando migration b2c3d4e5f6a7 como aplicada...${NC}"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend alembic -c migrations/alembic.ini stamp head || {
            echo -e "${YELLOW}⚠️  Erro ao marcar migration, continuando...${NC}"
        }
    fi
else
    echo -e "${CYAN}🔄 Banco vazio. Aplicando migrations do zero...${NC}"
    
    # Aplicar migrations
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend alembic -c migrations/alembic.ini upgrade head || {
        echo -e "${RED}❌ Erro ao aplicar migrations!${NC}"
        exit 1
    }
fi

echo -e "${CYAN}🔄 Reiniciando backend...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

echo -e "${CYAN}⏳ Aguardando 10 segundos para backend iniciar...${NC}"
sleep 10

echo -e "${CYAN}📊 Verificando logs do backend (últimas 50 linhas):${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=50 backend

echo -e "${CYAN}🏥 Verificando health check da API:${NC}"
curl -f http://localhost:5000/api/health 2>/dev/null && echo -e "${GREEN}✅ Health check OK!${NC}" || echo -e "${YELLOW}⚠️  Health check falhou. Verifique os logs acima.${NC}"

echo -e "${GREEN}✅ Script de correção concluído!${NC}"

