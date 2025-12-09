# Comandos para Produção - Habitus Forecast

Guia completo com todos os comandos necessários para rodar a aplicação em produção.

## 🚀 Setup Inicial do Servidor

### 1. Preparar Servidor (Primeira Vez)

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

### 2. Clonar Repositório

```bash
# Criar diretório
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Clonar repositório
cd /var/www
git clone https://github.com/seu-usuario/habitus-forecast-system.git
cd habitus-forecast-system
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.production.example .env

# Editar com suas configurações
nano .env
```

**Conteúdo mínimo do `.env`:**

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
CORS_ORIGINS=https://app.habitusforecast.com.br
MAX_CONTENT_LENGTH=16777216
```

**Gerar SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Criar Diretórios Necessários

```bash
mkdir -p backend/uploads backend/logs backend/database
chmod -R 755 backend/uploads backend/logs
```

---

## 🐳 Deploy com Docker (Recomendado)

### Primeiro Deploy

```bash
cd /var/www/habitus-forecast-system

# Build do frontend (se necessário)
cd frontend
pnpm install
pnpm run build
cd ..

# Iniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Executar migrações
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# Popular dados iniciais (se necessário)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python scripts/seed_db.py
```

### Verificar Status

```bash
# Ver status dos containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Health check
curl http://localhost:5000/api/health
```

### Atualizar Aplicação (Deploy Manual)

```bash
cd /var/www/habitus-forecast-system

# Atualizar código
git pull origin main

# Rebuild do frontend (se houver mudanças)
cd frontend
pnpm install
pnpm run build
cd ..

# Reiniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Executar migrações
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# Reiniciar backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Usar Script de Deploy

```bash
# Executar script de deploy automático
bash scripts/deploy-server.sh
```

---

## 🔧 Deploy sem Docker (Gunicorn Direto)

### Setup Inicial

```bash
cd /var/www/habitus-forecast-system/backend

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
nano .env  # Ajustar valores

# Executar migrações
alembic upgrade head

# Popular dados iniciais
python scripts/seed_db.py

# Build do frontend
cd ../frontend
pnpm install
pnpm run build
cd ..
```

### Iniciar com Gunicorn

```bash
cd /var/www/habitus-forecast-system/backend
source venv/bin/activate

# Iniciar servidor
gunicorn --config gunicorn_config.py wsgi:application
```

### Criar Serviço Systemd

```bash
sudo nano /etc/systemd/system/habitus-forecast.service
```

**Conteúdo do arquivo:**

```ini
[Unit]
Description=Habitus Forecast Flask Application
After=network.target

[Service]
User=seu-usuario
Group=seu-usuario
WorkingDirectory=/var/www/habitus-forecast-system/backend
Environment="PATH=/var/www/habitus-forecast-system/backend/venv/bin"
ExecStart=/var/www/habitus-forecast-system/backend/venv/bin/gunicorn --config gunicorn_config.py wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

**Ativar serviço:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable habitus-forecast
sudo systemctl start habitus-forecast
sudo systemctl status habitus-forecast
```

---

## 🌐 Configurar Nginx como Reverse Proxy

### Instalar Nginx

```bash
sudo apt install nginx -y
```

### Criar Configuração

```bash
sudo nano /etc/nginx/sites-available/habitus-forecast
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    client_max_body_size 16M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Ativar Site

```bash
sudo ln -s /etc/nginx/sites-available/habitus-forecast /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Configurar HTTPS/SSL

### Com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

### Usar Script Automático

```bash
sudo bash scripts/setup-ssl.sh
```

---

## 📊 Comandos de Monitoramento

### Ver Logs

```bash
# Logs do Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f db

# Logs do Systemd
sudo journalctl -u habitus-forecast -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Verificar Status

```bash
# Status dos containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Status do serviço
sudo systemctl status habitus-forecast

# Uso de recursos
docker stats
htop

# Health check
curl http://localhost:5000/api/health
curl https://seu-dominio.com/api/health
```

### Verificar Portas

```bash
# Ver o que está usando a porta 5000
sudo lsof -i :5000

# Ver portas abertas
sudo netstat -tulpn | grep LISTEN
```

---

## 🔄 Comandos de Manutenção

### Reiniciar Aplicação

```bash
# Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Systemd
sudo systemctl restart habitus-forecast

# Nginx
sudo systemctl restart nginx
```

### Parar Aplicação

```bash
# Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Systemd
sudo systemctl stop habitus-forecast
```

### Backup do Banco de Dados

```bash
# Usando script
bash scripts/backup-db.sh

# Manual (Docker)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup_$(date +%Y%m%d_%H%M%S).sql

# Manual (PostgreSQL direto)
pg_dump -U habitus habitus_forecast > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
# Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U habitus habitus_forecast < backup.sql

# PostgreSQL direto
psql -U habitus habitus_forecast < backup.sql
```

### Limpar Recursos Docker

```bash
# Limpar imagens não utilizadas
docker image prune -a

# Limpar volumes não utilizados
docker volume prune

# Limpar tudo (cuidado!)
docker system prune -a --volumes
```

---

## 🚨 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs de erro
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend
sudo journalctl -u habitus-forecast -n 50

# Verificar banco de dados
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U habitus -d habitus_forecast -c "\dt"

# Verificar variáveis de ambiente
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend env | grep -E "DATABASE|SECRET|FLASK"
```

### Erro de conexão com banco

```bash
# Verificar se banco está rodando
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps db

# Testar conexão
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python -c "from src.models.user import db; from src.main import app; app.app_context().push(); db.engine.connect()"
```

### Porta já em uso

```bash
# Ver o que está usando a porta
sudo lsof -i :5000

# Matar processo
sudo kill -9 <PID>

# Ou parar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Migrações falhando

```bash
# Ver status das migrações
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic current

# Ver histórico
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic history

# Downgrade (cuidado!)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic downgrade -1
```

---

## 📋 Checklist de Deploy

### Antes do Deploy

- [ ] Servidor preparado (Docker, Git instalados)
- [ ] Repositório clonado
- [ ] Arquivo `.env` configurado
- [ ] SECRET_KEY gerado e configurado
- [ ] POSTGRES_PASSWORD seguro configurado
- [ ] CORS_ORIGINS atualizado para domínio de produção
- [ ] Diretórios criados (uploads, logs)

### Deploy Inicial

- [ ] Build do frontend executado
- [ ] Containers iniciados com sucesso
- [ ] Migrações executadas
- [ ] Health check retorna OK
- [ ] Nginx configurado
- [ ] SSL/HTTPS configurado

### Após Deploy

- [ ] Aplicação acessível via HTTPS
- [ ] Login funcionando
- [ ] Upload de planilhas funcionando
- [ ] Dashboard carregando dados
- [ ] Logs sendo gerados corretamente
- [ ] Backup automático configurado

---

## 🔗 Comandos Rápidos de Referência

```bash
# Deploy completo (uma linha)
cd /var/www/habitus-forecast-system && git pull && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# Reiniciar tudo
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Ver logs em tempo real
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Backup rápido
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup_$(date +%Y%m%d).sql

# Health check
curl http://localhost:5000/api/health
```

---

## 📚 Documentação Adicional

- `docs/DEPLOY_SSH.md` - Guia completo de deploy SSH
- `docs/DOCKER.md` - Documentação Docker
- `docs/HTTPS_SETUP.md` - Configuração HTTPS/SSL
- `README_DEPLOY.md` - Resumo de deploy

---

**Última atualização:** Janeiro 2025

