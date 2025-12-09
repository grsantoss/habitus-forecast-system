# Guia Rápido: Comandos do Servidor

Referência rápida dos comandos mais usados no servidor.

---

## 🚀 Setup Inicial (Uma Vez)

```bash
# 1. Conectar ao servidor
ssh usuario@seu-servidor.com

# 2. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 3. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh && rm get-docker.sh

# 4. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Instalar Git
sudo apt install git -y

# 6. Instalar Node.js e pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm

# 7. Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
# Fazer logout e login novamente

# 8. Criar diretório
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
```

---

## 🔐 Configurar SSH para GitHub Actions

```bash
# 1. Gerar chave SSH
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
# Pressione Enter para deixar senha em branco

# 2. Adicionar chave pública ao servidor
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# 3. Ver chave privada (copiar para GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

---

## 📥 Instalar Aplicação

```bash
# 1. Clonar repositório
cd /var/www
git clone https://github.com/seu-usuario/habitus-forecast-system.git
cd habitus-forecast-system

# 2. Criar diretórios
mkdir -p backend/uploads backend/logs backend/database
chmod -R 755 backend/uploads backend/logs

# 3. Configurar .env
cp env.production.example .env
nano .env  # Editar variáveis

# 4. Gerar SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🚀 Deploy

### Primeiro Deploy

```bash
cd /var/www/habitus-forecast-system

# Iniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Executar migrações
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# Popular dados iniciais
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python scripts/seed_db.py
```

### Deploy Manual (Atualização)

```bash
cd /var/www/habitus-forecast-system
git pull origin main
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Usar Script de Deploy

```bash
cd /var/www/habitus-forecast-system
bash scripts/deploy-server.sh
```

---

## 📊 Monitoramento

### Ver Status

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Ver Logs

```bash
# Backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Todos
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Últimas 100 linhas
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 backend
```

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Uso de Recursos

```bash
docker stats
```

---

## 🔄 Gerenciamento

### Reiniciar

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### Parar

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Parar e Remover Volumes

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v
```

### Rebuild Completo

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 💾 Backup e Restore

### Backup do Banco

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U habitus habitus_forecast < backup_20250102.sql
```

### Backup Automático (Cron)

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã)
0 2 * * * cd /var/www/habitus-forecast-system && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db pg_dump -U habitus habitus_forecast > /var/backups/habitus_$(date +\%Y\%m\%d).sql
```

---

## 🧹 Limpeza

### Limpar Imagens Não Usadas

```bash
docker system prune -a
```

### Limpar Volumes Não Usados

```bash
docker volume prune
```

### Limpar Tudo (Cuidado!)

```bash
docker system prune -a --volumes
```

---

## 🔧 Troubleshooting

### Entrar no Container

```bash
# Backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend bash

# Banco de dados
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U habitus habitus_forecast
```

### Ver Variáveis de Ambiente

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend env
```

### Verificar Portas

```bash
sudo netstat -tulpn | grep 5000
```

### Verificar Espaço em Disco

```bash
df -h
docker system df
```

---

## 📝 Editar Arquivos

### Editar .env

```bash
nano .env
```

### Editar docker-compose

```bash
nano docker-compose.yml
```

### Editar Configuração Nginx (se configurado)

```bash
sudo nano /etc/nginx/sites-available/habitus-forecast
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx  # Recarregar
```

---

## 🔐 Segurança

### Verificar Permissões

```bash
ls -la ~/.ssh/
ls -la backend/uploads/
```

### Ajustar Permissões

```bash
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod -R 755 backend/uploads
```

---

## 📚 Documentação Completa

Para guia detalhado passo a passo, veja: `docs/GUIA_COMPLETO_PRODUCAO.md`

