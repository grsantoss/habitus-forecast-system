#!/bin/bash
# Script de Deploy Completo para Produção
# Execute: bash scripts/deploy-producao-completo.sh
# 
# Este script automatiza todo o processo de deploy em produção

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🚀 Deploy Completo para Produção - Habitus Forecast${NC}"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: Execute do diretório raiz do projeto${NC}"
    exit 1
fi

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "   Criando a partir de env.production.example..."
    cp env.production.example .env
    echo -e "${YELLOW}⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações antes de continuar!${NC}"
    echo ""
    read -p "Pressione Enter após editar o .env..."
fi

# Carregar variáveis de ambiente
set -a
source .env 2>/dev/null || true
set +a

# Validar variáveis críticas
echo -e "${CYAN}🔍 Validando configurações...${NC}"
if [ -z "$SECRET_KEY" ] || [ -z "$DATABASE_URL" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}❌ Variáveis críticas não configuradas no .env${NC}"
    echo "   Configure: SECRET_KEY, DATABASE_URL, POSTGRES_PASSWORD"
    exit 1
fi

if [ "$FLASK_ENV" != "production" ]; then
    echo -e "${YELLOW}⚠️  FLASK_ENV não está definido como 'production'${NC}"
    read -p "Continuar mesmo assim? (s/n): " confirm
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Configurações validadas${NC}"
echo ""

# Executar validação pré-deploy
echo -e "${CYAN}🔍 Executando validação pré-deploy...${NC}"
if [ -f "scripts/validate-pre-deploy.sh" ]; then
    bash scripts/validate-pre-deploy.sh || {
        echo -e "${RED}❌ Validação falhou. Corrija os erros antes de continuar.${NC}"
        exit 1
    }
else
    echo -e "${YELLOW}⚠️  Script de validação não encontrado, pulando...${NC}"
fi
echo ""

# Build do frontend
echo -e "${CYAN}📦 Building frontend...${NC}"
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        echo "Instalando dependências..."
        pnpm install --frozen-lockfile || npm install
        
        echo "Building..."
        pnpm run build || npm run build
    else
        echo -e "${YELLOW}⚠️  package.json não encontrado, pulando build do frontend${NC}"
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  Diretório frontend não encontrado${NC}"
fi
echo ""

# Build Docker
echo -e "${CYAN}🐳 Building containers Docker...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
echo ""

# Parar containers existentes
echo -e "${CYAN}🛑 Parando containers existentes...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
echo ""

# Iniciar containers
echo -e "${CYAN}🚀 Iniciando containers...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
echo ""

# Aguardar serviços iniciarem
echo -e "${CYAN}⏳ Aguardando serviços iniciarem...${NC}"
sleep 10

# Verificar saúde dos serviços
echo -e "${CYAN}🏥 Verificando saúde dos serviços...${NC}"
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend está respondendo${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Tentativa $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Backend não está respondendo após $max_attempts tentativas${NC}"
    echo "   Verifique os logs: docker-compose logs backend"
    exit 1
fi

# Verificar status dos containers
echo ""
echo -e "${CYAN}📊 Status dos containers:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Configure HTTPS/SSL: sudo bash scripts/setup-ssl.sh"
echo "2. Configure monitoramento: bash scripts/setup-monitoring.sh"
echo "3. Verifique os logs: docker-compose logs -f"
echo ""
echo "Acesse: http://localhost:5000/api/health"
echo ""

