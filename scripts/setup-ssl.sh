#!/bin/bash
# Script para configurar HTTPS/SSL com Let's Encrypt e Nginx
# Execute: sudo bash scripts/setup-ssl.sh

set -e

echo "🔒 Configurando HTTPS/SSL para Habitus Forecast"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado como root (use sudo)"
    exit 1
fi

# Solicitar informações
read -p "Digite o domínio (ex: exemplo.com): " DOMAIN
read -p "Digite o email para notificações do Let's Encrypt: " EMAIL
read -p "Caminho completo do projeto (ex: /var/www/habitus-forecast-system): " PROJECT_PATH

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$PROJECT_PATH" ]; then
    echo "❌ Todos os campos são obrigatórios"
    exit 1
fi

echo ""
echo "📋 Configurações:"
echo "   Domínio: $DOMAIN"
echo "   Email: $EMAIL"
echo "   Caminho: $PROJECT_PATH"
echo ""
read -p "Continuar? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "❌ Cancelado"
    exit 1
fi

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Criar configuração Nginx temporária (HTTP)
echo ""
echo "📝 Criando configuração Nginx..."
NGINX_CONFIG="/etc/nginx/sites-available/habitus-forecast"

# Substituir placeholders no template
sed "s|seu-dominio.com|$DOMAIN|g; s|/path/to/habitus-forecast-system|$PROJECT_PATH|g" \
    "$PROJECT_PATH/nginx/habitus-forecast-http.conf" > "$NGINX_CONFIG"

# Habilitar site
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Testar configuração Nginx
echo ""
echo "🔍 Testando configuração Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx"
    exit 1
fi

# Reiniciar Nginx
echo ""
echo "🔄 Reiniciando Nginx..."
systemctl restart nginx
systemctl enable nginx

# Obter certificado SSL
echo ""
echo "🔐 Obtendo certificado SSL do Let's Encrypt..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive

if [ $? -ne 0 ]; then
    echo "❌ Erro ao obter certificado SSL"
    echo "   Verifique se:"
    echo "   1. O domínio está apontando para este servidor (DNS)"
    echo "   2. As portas 80 e 443 estão abertas no firewall"
    exit 1
fi

# Atualizar configuração Nginx com SSL
echo ""
echo "📝 Atualizando configuração Nginx com SSL..."
sed "s|seu-dominio.com|$DOMAIN|g; s|/path/to/habitus-forecast-system|$PROJECT_PATH|g" \
    "$PROJECT_PATH/nginx/habitus-forecast.conf" > "$NGINX_CONFIG"

# Testar novamente
nginx -t
systemctl reload nginx

# Configurar renovação automática
echo ""
echo "🔄 Configurando renovação automática..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Verificar renovação
echo ""
echo "🧪 Testando renovação automática..."
certbot renew --dry-run

echo ""
echo "✅ HTTPS/SSL configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Atualize CORS_ORIGINS no .env: https://$DOMAIN"
echo "   2. Atualize VITE_API_URL no frontend: https://$DOMAIN/api"
echo "   3. Acesse: https://$DOMAIN"
echo ""
echo "🔍 Verificar certificado:"
echo "   certbot certificates"
echo ""
echo "📊 Status Nginx:"
echo "   systemctl status nginx"

