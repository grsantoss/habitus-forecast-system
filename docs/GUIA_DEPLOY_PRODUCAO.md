# Guia Completo de Deploy para Produção

**Data:** 2025-12-09  
**Versão:** 1.0

---

## 📋 Pré-requisitos

Antes de iniciar o deploy, certifique-se de ter:

- [ ] Servidor Linux (Ubuntu 20.04+ recomendado)
- [ ] Acesso SSH ao servidor
- [ ] Domínio configurado e apontando para o servidor
- [ ] Portas 80 e 443 abertas no firewall
- [ ] Docker e Docker Compose instalados
- [ ] Git instalado

---

## 🚀 Deploy Completo em 5 Passos

### Passo 1: Preparar Servidor

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Executar script de setup (instala Docker, Git, etc.)
sudo bash scripts/setup-server.sh

# OU instalar manualmente:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo apt install git -y
```

### Passo 2: Clonar e Configurar Aplicação

```bash
# Criar diretório
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Clonar repositório
cd /var/www
git clone https://github.com/seu-usuario/habitus-forecast-system.git
cd habitus-forecast-system

# Copiar e configurar variáveis de ambiente
cp env.production.example .env
nano .env  # Editar com suas configurações
```

**Configurações mínimas no `.env`:**

```env
# PostgreSQL
POSTGRES_DB=habitus_forecast
POSTGRES_USER=habitus
POSTGRES_PASSWORD=senha_super_segura_aqui
POSTGRES_PORT=5432

# Backend
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
DATABASE_URL=postgresql://habitus:senha_super_segura_aqui@db:5432/habitus_forecast
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
WORKERS=4
CORS_ORIGINS=https://seu-dominio.com
MAX_CONTENT_LENGTH=16777216

# Frontend
VITE_API_URL=https://seu-dominio.com/api

# Monitoramento (Opcional mas recomendado)
SENTRY_DSN=https://seu-dsn-do-sentry@sentry.io/projeto
```

### Passo 3: Configurar HTTPS/SSL

```bash
# Executar script automatizado
sudo bash scripts/setup-ssl.sh

# OU configurar manualmente:
# 1. Instalar Nginx e Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Configurar Nginx temporariamente (HTTP)
sudo cp nginx/habitus-forecast-http.conf /etc/nginx/sites-available/habitus-forecast
sudo nano /etc/nginx/sites-available/habitus-forecast  # Ajustar domínio e caminho
sudo ln -s /etc/nginx/sites-available/habitus-forecast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 3. Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# 4. Atualizar configuração com SSL completo
sudo cp nginx/habitus-forecast.conf /etc/nginx/sites-available/habitus-forecast
sudo nano /etc/nginx/sites-available/habitus-forecast  # Ajustar domínio e caminho
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 4: Build e Iniciar Aplicação

```bash
# Build do frontend
cd frontend
pnpm install
pnpm run build
cd ..

# Build e iniciar com Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl http://localhost:5000/api/health
```

### Passo 5: Validar e Configurar Monitoramento

```bash
# Executar validação pré-deploy
bash scripts/validate-pre-deploy.sh

# Configurar monitoramento (opcional mas recomendado)
bash scripts/setup-monitoring.sh

# Verificar logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

---

## ✅ Checklist de Validação

Após o deploy, verificar:

- [ ] HTTPS funcionando: `https://seu-dominio.com`
- [ ] Redirecionamento HTTP → HTTPS funcionando
- [ ] API respondendo: `https://seu-dominio.com/api/health`
- [ ] Frontend carregando corretamente
- [ ] Login funcionando
- [ ] Containers rodando: `docker-compose ps`
- [ ] Logs sem erros críticos
- [ ] Monitoramento configurado (Sentry/UptimeRobot)

---

## 🔧 Configuração Adicional

### Backup Automático

```bash
# Configurar cron job para backup diário
crontab -e

# Adicionar linha:
0 2 * * * /var/www/habitus-forecast-system/backend/scripts/backup_db.sh
```

### Atualizações Futuras

```bash
# Atualizar código
cd /var/www/habitus-forecast-system
git pull origin main

# Rebuild e restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Executar migrações (se houver)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```bash
# Verificar se container do banco está rodando
docker-compose ps db

# Verificar logs
docker-compose logs db

# Reiniciar banco
docker-compose restart db
```

### Erro: "Port already in use"

```bash
# Verificar o que está usando a porta
sudo lsof -i :5000

# Parar containers conflitantes
docker-compose down
```

### Erro: "Nginx não inicia"

```bash
# Testar configuração
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

### Erro: "Certificado SSL não renova"

```bash
# Verificar timer
sudo systemctl status certbot.timer

# Renovar manualmente
sudo certbot renew

# Testar renovação
sudo certbot renew --dry-run
```

---

## 📚 Documentação Relacionada

- `docs/PRIORIDADES_PRODUCAO.md` - Lista de prioridades
- `docs/MONITORAMENTO.md` - Guia de monitoramento
- `docs/SECURITY.md` - Guia de segurança
- `HTTPS_QUICK_START.md` - Guia rápido de HTTPS
- `scripts/validate-pre-deploy.sh` - Script de validação

---

**Última atualização:** 2025-12-09

