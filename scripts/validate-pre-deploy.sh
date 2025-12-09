#!/bin/bash
# Script de validação pré-deploy
# Execute: bash scripts/validate-pre-deploy.sh
# Valida todas as condições críticas antes do deploy em produção

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${CYAN}🔍 Validação Pré-Deploy - Habitus Forecast${NC}"
echo "=========================================="
echo ""

# Função para erro
error() {
    echo -e "${RED}❌ ERRO: $1${NC}" >&2
    ERRORS=$((ERRORS + 1))
}

# Função para aviso
warning() {
    echo -e "${YELLOW}⚠️  AVISO: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Função para sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Verificar se está no diretório correto
echo -e "${CYAN}1. Verificando estrutura do projeto...${NC}"
if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml não encontrado. Execute do diretório raiz do projeto."
    exit 1
fi
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Estrutura de diretórios inválida. Backend ou frontend não encontrados."
    exit 1
fi
success "Estrutura do projeto OK"
echo ""

# 2. Verificar arquivo .env
echo -e "${CYAN}2. Verificando variáveis de ambiente...${NC}"
if [ ! -f ".env" ]; then
    error "Arquivo .env não encontrado!"
    echo "   Crie o arquivo .env baseado em env.production.example"
    exit 1
fi
success "Arquivo .env encontrado"

# Carregar variáveis de ambiente
set -a
source .env 2>/dev/null || true
set +a

# Validar variáveis obrigatórias
REQUIRED_VARS=("SECRET_KEY" "DATABASE_URL" "POSTGRES_PASSWORD")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "$var não configurada no .env"
    else
        success "$var configurada"
    fi
done

# Validar SECRET_KEY
if [ -n "$SECRET_KEY" ] && [ ${#SECRET_KEY} -lt 32 ]; then
    error "SECRET_KEY deve ter pelo menos 32 caracteres (atual: ${#SECRET_KEY})"
fi

# Validar DATABASE_URL
if [ -n "$DATABASE_URL" ] && [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    error "DATABASE_URL deve começar com postgresql://"
fi

# Validar CORS_ORIGINS em produção
if [ "$FLASK_ENV" = "production" ] && [ -n "$CORS_ORIGINS" ]; then
    if echo "$CORS_ORIGINS" | grep -q "localhost\|127.0.0.1"; then
        warning "CORS_ORIGINS contém localhost em produção. Isso pode ser um risco de segurança."
    fi
fi

# Validar VITE_API_URL
if [ -z "$VITE_API_URL" ]; then
    error "VITE_API_URL não configurada. Necessária para build do frontend."
elif echo "$VITE_API_URL" | grep -q "localhost\|127.0.0.1"; then
    warning "VITE_API_URL aponta para localhost. Certifique-se de que é correto para produção."
fi

echo ""

# 3. Verificar dependências do backend
echo -e "${CYAN}3. Verificando dependências do backend...${NC}"
if [ ! -f "backend/requirements.txt" ]; then
    error "backend/requirements.txt não encontrado"
else
    success "requirements.txt encontrado"
fi
echo ""

# 4. Verificar dependências do frontend
echo -e "${CYAN}4. Verificando dependências do frontend...${NC}"
if [ ! -f "frontend/package.json" ]; then
    error "frontend/package.json não encontrado"
else
    success "package.json encontrado"
fi
echo ""

# 5. Verificar migrations
echo -e "${CYAN}5. Verificando migrations...${NC}"
if [ ! -f "backend/migrations/alembic.ini" ]; then
    error "backend/migrations/alembic.ini não encontrado"
else
    success "alembic.ini encontrado"
fi

if [ ! -d "backend/migrations/versions" ] || [ -z "$(ls -A backend/migrations/versions/*.py 2>/dev/null)" ]; then
    warning "Nenhuma migration encontrada em backend/migrations/versions/"
else
    migration_count=$(ls -1 backend/migrations/versions/*.py 2>/dev/null | wc -l)
    success "$migration_count migration(s) encontrada(s)"
fi
echo ""

# 6. Verificar configuração do Nginx
echo -e "${CYAN}6. Verificando configuração do Nginx...${NC}"
if [ ! -f "nginx/habitus-forecast.conf" ]; then
    warning "nginx/habitus-forecast.conf não encontrado"
else
    if grep -q "/path/to/habitus-forecast-system" nginx/habitus-forecast.conf; then
        error "Caminho placeholder no nginx/habitus-forecast.conf não foi ajustado"
    else
        success "Configuração do Nginx OK"
    fi
fi
echo ""

# 7. Verificar scripts de build
echo -e "${CYAN}7. Verificando scripts de build...${NC}"
if [ ! -f "frontend/build.sh" ] || [ ! -f "frontend/build.ps1" ]; then
    warning "Scripts de build do frontend não encontrados"
else
    success "Scripts de build encontrados"
fi
echo ""

# 8. Verificar Dockerfiles
echo -e "${CYAN}8. Verificando Dockerfiles...${NC}"
if [ ! -f "backend/Dockerfile" ]; then
    error "backend/Dockerfile não encontrado"
else
    success "backend/Dockerfile encontrado"
fi

if [ ! -f "frontend/Dockerfile" ]; then
    warning "frontend/Dockerfile não encontrado"
else
    success "frontend/Dockerfile encontrado"
fi
echo ""

# 9. Verificar se há SECRET_KEY hardcoded no código
echo -e "${CYAN}9. Verificando segurança do código...${NC}"
if grep -r "SECRET_KEY.*=.*['\"].*habitus" backend/src/ --include="*.py" | grep -v "os.getenv" | grep -v "#" > /dev/null 2>&1; then
    error "SECRET_KEY hardcoded encontrada no código!"
    grep -r "SECRET_KEY.*=.*['\"].*habitus" backend/src/ --include="*.py" | grep -v "os.getenv" | grep -v "#"
else
    success "Nenhuma SECRET_KEY hardcoded encontrada"
fi

if grep -r "debug=True" backend/src/ --include="*.py" > /dev/null 2>&1; then
    warning "debug=True encontrado no código. Verifique se não será usado em produção."
else
    success "Nenhum debug=True hardcoded encontrado"
fi
echo ""

# 10. Verificar se há console.log no frontend (apenas aviso)
echo -e "${CYAN}10. Verificando logs de debug no frontend...${NC}"
console_log_count=$(grep -r "console\.log" frontend/src/ --include="*.jsx" --include="*.js" 2>/dev/null | wc -l || echo "0")
if [ "$console_log_count" -gt 0 ]; then
    warning "$console_log_count console.log encontrado(s) no frontend. Considere remover para produção."
else
    success "Nenhum console.log encontrado no frontend"
fi
echo ""

# 11. Verificar configuração de monitoramento
echo -e "${CYAN}11. Verificando configuração de monitoramento...${NC}"
if [ -z "$SENTRY_DSN" ]; then
    warning "SENTRY_DSN não configurado. Monitoramento de erros desabilitado."
    echo "   Configure SENTRY_DSN para habilitar monitoramento de erros em produção."
else
    success "SENTRY_DSN configurado"
fi

# Verificar se sentry-sdk está instalado
if grep -q "sentry-sdk" backend/requirements.txt; then
    success "sentry-sdk está no requirements.txt"
else
    warning "sentry-sdk não encontrado no requirements.txt"
fi
echo ""

# 12. Verificar endpoint de health check
echo -e "${CYAN}12. Verificando endpoint de health check...${NC}"
if grep -q "/api/health" backend/src/main.py backend/src/routes/*.py 2>/dev/null; then
    success "Endpoint /api/health encontrado"
else
    warning "Endpoint /api/health não encontrado. Configure para monitoramento de uptime."
fi
echo ""

# Resumo
echo "=========================================="
echo -e "${CYAN}📊 Resumo da Validação${NC}"
echo "=========================================="
echo -e "Erros encontrados: ${RED}${ERRORS}${NC}"
echo -e "Avisos encontrados: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Validação FALHOU!${NC}"
    echo "Corrija os erros acima antes de fazer deploy."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Validação concluída com avisos.${NC}"
    echo "Revise os avisos acima antes de fazer deploy."
    exit 0
else
    echo -e "${GREEN}✅ Validação concluída com sucesso!${NC}"
    echo "O projeto está pronto para deploy."
    exit 0
fi

