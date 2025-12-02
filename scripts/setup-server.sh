#!/bin/bash
# Script de setup inicial do servidor
# Execute: bash scripts/setup-server.sh

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Configurando servidor para Habitus Forecast...${NC}"

# Verificar se é root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Execute como root ou com sudo${NC}"
    exit 1
fi

# Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo -e "${GREEN}✅ Docker já instalado${NC}"
fi

# Instalar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🐳 Instalando Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}✅ Docker Compose já instalado${NC}"
fi

# Instalar Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📥 Instalando Git...${NC}"
    apt install git -y
else
    echo -e "${GREEN}✅ Git já instalado${NC}"
fi

# Instalar Node.js e pnpm (para build do frontend)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando pnpm...${NC}"
    npm install -g pnpm
fi

# Adicionar usuário ao grupo docker
read -p "Digite o nome do usuário para adicionar ao grupo docker (padrão: $USER): " DOCKER_USER
DOCKER_USER=${DOCKER_USER:-$USER}
usermod -aG docker "$DOCKER_USER" || echo -e "${YELLOW}⚠️ Usuário $DOCKER_USER não encontrado${NC}"

# Criar diretório para aplicações
APP_DIR="/var/www"
mkdir -p "$APP_DIR"
chown -R "$DOCKER_USER:$DOCKER_USER" "$APP_DIR" || true

echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Faça logout e login novamente para aplicar grupo docker"
echo "2. Clone o repositório: cd $APP_DIR && git clone <seu-repositorio>"
echo "3. Configure o arquivo .env"
echo "4. Execute: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"

