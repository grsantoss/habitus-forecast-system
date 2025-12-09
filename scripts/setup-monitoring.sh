#!/bin/bash
# Script para configurar monitoramento básico
# Execute: bash scripts/setup-monitoring.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔧 Configuração de Monitoramento - Habitus Forecast${NC}"
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
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
fi

echo -e "${CYAN}📋 Configuração do Sentry${NC}"
echo ""
echo "Para configurar o Sentry:"
echo "1. Acesse https://sentry.io e crie uma conta"
echo "2. Crie um novo projeto (Flask/Python)"
echo "3. Copie o DSN fornecido"
echo "4. Adicione no arquivo .env:"
echo ""
echo -e "${YELLOW}   SENTRY_DSN=https://seu-dsn-do-sentry@sentry.io/projeto${NC}"
echo ""

read -p "Você já tem um DSN do Sentry? (s/n): " has_dsn

if [ "$has_dsn" = "s" ] || [ "$has_dsn" = "S" ]; then
    read -p "Cole o DSN do Sentry: " sentry_dsn
    
    # Adicionar ao .env se não existir
    if ! grep -q "SENTRY_DSN=" .env; then
        echo "" >> .env
        echo "# Sentry - Monitoramento de erros" >> .env
        echo "SENTRY_DSN=$sentry_dsn" >> .env
        echo -e "${GREEN}✅ SENTRY_DSN adicionado ao .env${NC}"
    else
        # Atualizar se já existir
        sed -i "s|SENTRY_DSN=.*|SENTRY_DSN=$sentry_dsn|" .env
        echo -e "${GREEN}✅ SENTRY_DSN atualizado no .env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Pule esta etapa e configure depois manualmente${NC}"
fi

echo ""
echo -e "${CYAN}📋 Configuração do UptimeRobot${NC}"
echo ""
echo "Para configurar o UptimeRobot:"
echo "1. Acesse https://uptimerobot.com e crie uma conta"
echo "2. Adicione um novo monitor HTTP(s)"
echo "3. URL: https://seu-dominio.com/api/health"
echo "4. Interval: 5 minutos"
echo "5. Configure alertas por email"
echo ""

read -p "Você já configurou o UptimeRobot? (s/n): " has_uptime

if [ "$has_uptime" = "s" ] || [ "$has_uptime" = "S" ]; then
    echo -e "${GREEN}✅ UptimeRobot configurado${NC}"
else
    echo -e "${YELLOW}⚠️  Configure depois manualmente${NC}"
fi

echo ""
echo -e "${CYAN}📦 Instalando dependências${NC}"

# Verificar se Python está disponível
if command -v python3 &> /dev/null; then
    echo "Instalando sentry-sdk..."
    pip3 install sentry-sdk[flask] || echo -e "${YELLOW}⚠️  Erro ao instalar sentry-sdk. Instale manualmente: pip install sentry-sdk[flask]${NC}"
else
    echo -e "${YELLOW}⚠️  Python3 não encontrado. Instale manualmente: pip install sentry-sdk[flask]${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Configuração concluída!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Configure o Sentry (se ainda não fez)"
echo "2. Configure o UptimeRobot (se ainda não fez)"
echo "3. Teste o endpoint /api/health"
echo "4. Verifique os logs da aplicação"
echo ""
echo "Documentação: docs/MONITORAMENTO.md"

