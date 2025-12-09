# Guia Completo: Instalação e Deploy em Produção - Habitus Forecast

**Versão:** 2.0  
**Última atualização:** 2025-01-XX  
**Para:** Administradores de Sistema e DevOps

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Arquitetura da Aplicação](#arquitetura-da-aplicação)
4. [Preparação do Servidor](#preparação-do-servidor)
5. [Instalação da Aplicação](#instalação-da-aplicação)
6. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
7. [Build e Deploy](#build-e-deploy)
8. [Configuração de HTTPS/SSL](#configuração-de-httpsssl)
9. [Configuração do Nginx](#configuração-do-nginx)
10. [Validação e Testes](#validação-e-testes)
11. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
12. [Troubleshooting](#troubleshooting)
13. [Comandos Úteis](#comandos-úteis)

---

## 🎯 Visão Geral

O **Habitus Forecast** é uma aplicação web completa para gestão financeira empresarial, composta por:

- **Backend**: API Flask (Python 3.11) com PostgreSQL
- **Frontend**: Aplicação React (Vite) servida como arquivos estáticos
- **Banco de Dados**: PostgreSQL 15
- **Servidor Web**: Nginx como reverse proxy
- **Containerização**: Docker e Docker Compose

### Requisitos Mínimos do Servidor

- **CPU**: 2 cores
- **RAM**: 4GB (recomendado 8GB)
- **Disco**: 20GB livres (recomendado 50GB)
- **Sistema Operacional**: Ubuntu 20.04+ ou Debian 11+
- **Rede**: Portas 80, 443 e 5000 abertas

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Servidor Linux com acesso SSH
- ✅ Domínio configurado e apontando para o servidor (DNS)
- ✅ Acesso root ou usuário com permissões sudo
- ✅ Conhecimento básico de Linux, Docker e Nginx
- ✅ Repositório Git com o código da aplicação

---

## 🏗️ Arquitetura da Aplicação

```
┌─────────────────┐
│   Nginx (443)   │ ← HTTPS/SSL
└────────┬────────┘
         │
         ├─→ /api → Backend Flask (5000)
         │
         └─→ / → Frontend React (arquivos estáticos)
                  │
                  └─→ PostgreSQL (5432)
```

### Estrutura de Diretórios em Produção

```
/var/www/habitus-forecast-system/
├── backend/
│   ├── src/
│   │   └── static/          # Frontend build (copiado durante deploy)
│   ├── uploads/             # Arquivos enviados pelos usuários
│   ├── database/            # SQLite (apenas dev, não usado em prod)
│   ├── logs/                # Logs da aplicação
│   └── migrations/          # Migrações do banco de dados
├── frontend/                # Código fonte (usado apenas para build)
├── nginx/                   # Configurações do Nginx
├── scripts/                 # Scripts de deploy e manutenção
├── docker-compose.yml       # Configuração base Docker
├── docker-compose.prod.yml  # Override para produção
└── .env                     # Variáveis de ambiente (NÃO commitado)
```

---

## 🖥️ Preparação do Servidor

### Passo 1: Conectar ao Servidor

```bash
ssh usuario@seu-servidor.com
# ou
ssh root@192.168.1.100
```

### Passo 2: Executar Script de Setup Automatizado

O projeto inclui um script que automatiza a instalação de todas as dependências:

```bash
# Baixar e executar script de setup
sudo bash scripts/setup-server.sh
```

**O que o script faz:**
- Atualiza o sistema operacional
- Instala Docker e Docker Compose
- Instala Git
- Instala Node.js 18 e pnpm (para build do frontend)
- Adiciona usuário ao grupo docker
- Cria diretório `/var/www`

### Passo 3: Instalação Manual (Alternativa)

Se preferir instalar manualmente:

```bash
# 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# 3. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Instalar Git
sudo apt install git -y

# 5. Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 6. Instalar pnpm
sudo npm install -g pnpm

# 7. Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# 8. Criar diretório para aplicações
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
```

**⚠️ IMPORTANTE:** Após adicionar o usuário ao grupo docker, faça logout e login novamente:

```bash
exit
# Reconectar
ssh usuario@seu-servidor.com
```

**Verificar instalação:**

```bash
docker --version          # Deve mostrar versão do Docker
docker-compose --version  # Deve mostrar versão do Docker Compose
git --version             # Deve mostrar versão do Git
node --version            # Deve mostrar v18.x.x
pnpm --version            # Deve mostrar versão do pnpm
docker ps                 # Não deve pedir senha
```

### Passo 4: Configurar Firewall

```bash
# Verificar status do firewall
sudo ufw status

# Permitir portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5000/tcp  # Backend (opcional, apenas para testes)

# Habilitar firewall
sudo ufw enable

# Verificar regras
sudo ufw status numbered
```

---

## 📥 Instalação da Aplicação

### Passo 1: Clonar Repositório

```bash
# Ir para diretório de aplicações
cd /var/www

# Clonar repositório
git clone https://github.com/seu-usuario/habitus-forecast-system.git
# OU se for repositório privado:
git clone https://SEU_TOKEN@github.com/seu-usuario/habitus-forecast-system.git

# Entrar no diretório
cd habitus-forecast-system
```

### Passo 2: Criar Diretórios Necessários

```bash
# Criar diretórios para uploads, logs e banco de dados
mkdir -p backend/uploads backend/logs backend/database
chmod -R 755 backend/uploads backend/logs
```

### Passo 3: Verificar Estrutura

```bash
# Verificar se todos os arquivos necessários estão presentes
ls -la
ls -la backend/
ls -la frontend/
ls -la nginx/
ls -la scripts/
```

---

## ⚙️ Configuração de Variáveis de Ambiente

### Passo 1: Copiar Arquivo de Exemplo

```bash
# Copiar arquivo de exemplo
cp env.production.example .env

# Editar arquivo
nano .env
# ou
vim .env
```

### Passo 2: Gerar SECRET_KEY

```bash
# Gerar chave secreta segura
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Copie o resultado** e use no arquivo `.env`.

### Passo 3: Configurar Variáveis Obrigatórias

Edite o arquivo `.env` com as seguintes configurações:

```env
# ============================================
# PostgreSQL Database
# ============================================
POSTGRES_DB=habitus_forecast
POSTGRES_USER=habitus
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
POSTGRES_PORT=5432

# ============================================
# Backend Flask
# ============================================
# Cole a SECRET_KEY gerada no passo anterior
SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# URL do banco de dados (usar nome do serviço Docker 'db')
DATABASE_URL=postgresql://habitus:SUA_SENHA_FORTE_AQUI@db:5432/habitus_forecast

# Ambiente
FLASK_ENV=production
FLASK_DEBUG=False

# Servidor
PORT=5000
WORKERS=4

# CORS - Domínios de produção permitidos
# IMPORTANTE: Substitua pelo seu domínio real
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com

# Upload
MAX_CONTENT_LENGTH=16777216

# ============================================
# Frontend (Vite)
# ============================================
# IMPORTANTE: Configure antes de fazer build do frontend
VITE_API_URL=https://seu-dominio.com/api

# ============================================
# Monitoramento (Opcional mas Recomendado)
# ============================================
# Sentry - Monitoramento de erros
# 1. Crie conta em https://sentry.io
# 2. Crie projeto Flask/Python
# 3. Copie o DSN e cole abaixo
# SENTRY_DSN=https://seu-dsn-do-sentry@sentry.io/projeto

# Versão da aplicação
APP_VERSION=1.0.0

# ============================================
# Logging
# ============================================
LOG_LEVEL=INFO
LOG_FORMAT=json
```

**⚠️ IMPORTANTE:**
- Substitua `SUA_SENHA_FORTE_AQUI` por uma senha forte e única
- Use a mesma senha em `POSTGRES_PASSWORD` e `DATABASE_URL`
- Substitua `seu-dominio.com` pelo seu domínio real
- Se não tiver domínio ainda, use o IP temporariamente: `http://SEU_IP:5000`

### Passo 4: Validar Configuração

```bash
# Executar script de validação
bash scripts/validate-pre-deploy.sh
```

O script verifica:
- ✅ Estrutura do projeto
- ✅ Variáveis de ambiente obrigatórias
- ✅ Segurança (SECRET_KEY, CORS, etc.)
- ✅ Dependências e migrations
- ✅ Configurações do Nginx

**Se houver erros**, corrija antes de continuar.

---

## 🚀 Build e Deploy

### Passo 1: Build do Frontend

O frontend precisa ser buildado antes de iniciar os containers:

```bash
# Ir para diretório do frontend
cd frontend

# Instalar dependências
pnpm install --frozen-lockfile

# Configurar variável de ambiente para build
export VITE_API_URL=https://seu-dominio.com/api
# OU se não tiver domínio ainda:
export VITE_API_URL=http://SEU_IP:5000/api

# Build do frontend
pnpm run build

# Verificar se build foi criado
ls -la ../backend/src/static/

# Voltar para raiz do projeto
cd ..
```

**O build do frontend será copiado para `backend/src/static/`** (configurado no `vite.config.js`).

### Passo 2: Deploy com Docker Compose

#### Opção A: Deploy Automatizado (Recomendado)

```bash
# Executar script de deploy completo
bash scripts/deploy-producao-completo.sh
```

O script automatiza:
- ✅ Validação pré-deploy
- ✅ Build do frontend (se necessário)
- ✅ Build dos containers Docker
- ✅ Parada de containers existentes
- ✅ Inicialização dos containers
- ✅ Verificação de saúde dos serviços

#### Opção B: Deploy Manual

```bash
# 1. Build dos containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 2. Parar containers existentes (se houver)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# 3. Iniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. Verificar status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 5. Ver logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Passo 3: Verificar Migrações

As migrações são executadas automaticamente durante a inicialização do backend (ver `docker-compose.prod.yml`), mas você pode executar manualmente:

```bash
# Executar migrações manualmente
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Passo 4: Verificar Saúde dos Serviços

```bash
# Verificar health check da API
curl http://localhost:5000/api/health

# Resposta esperada:
# {"status": "ok", "message": "Habitus Forecast API está funcionando"}
```

### Passo 5: Verificar Logs

```bash
# Ver logs do backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Ver logs do banco de dados
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f db

# Ver logs de todos os containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

**Para sair dos logs:** Pressione `Ctrl + C`

---

## 🔒 Configuração de HTTPS/SSL

### Passo 1: Instalar Nginx e Certbot

```bash
# Instalar Nginx e Certbot
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Passo 2: Configurar Nginx Temporariamente (HTTP)

Antes de obter o certificado SSL, configure o Nginx para HTTP:

```bash
# Copiar configuração HTTP
sudo cp nginx/habitus-forecast-http.conf /etc/nginx/sites-available/habitus-forecast

# Editar configuração
sudo nano /etc/nginx/sites-available/habitus-forecast
```

**Ajustar no arquivo:**
- `server_name`: Seu domínio (ex: `app.habitusforecast.com.br`)
- `root`: Caminho completo para `backend/src/static` (ex: `/var/www/habitus-forecast-system/backend/src/static`)

```nginx
server_name app.habitusforecast.com.br;
root /var/www/habitus-forecast-system/backend/src/static;
```

```bash
# Habilitar site
sudo ln -s /etc/nginx/sites-available/habitus-forecast /etc/nginx/sites-enabled/

# Remover site padrão (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Passo 3: Obter Certificado SSL

```bash
# Obter certificado SSL do Let's Encrypt
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Durante o processo, você será solicitado a:
# - Inserir email para notificações
# - Aceitar termos de serviço
# - Escolher redirecionar HTTP para HTTPS (recomendado: 2)
```

**⚠️ IMPORTANTE:** O domínio deve estar apontando para o servidor (DNS configurado) antes de executar este comando.

### Passo 4: Atualizar Configuração Nginx com SSL

Após obter o certificado, atualize a configuração do Nginx:

```bash
# Copiar configuração completa com SSL
sudo cp nginx/habitus-forecast.conf /etc/nginx/sites-available/habitus-forecast

# Editar configuração
sudo nano /etc/nginx/sites-available/habitus-forecast
```

**Ajustar no arquivo:**
- `server_name`: Seu domínio
- `ssl_certificate` e `ssl_certificate_key`: Caminhos gerados pelo Certbot (geralmente já corretos)
- `root`: Caminho completo para `backend/src/static`

```bash
# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Passo 5: Configurar Renovação Automática

```bash
# Habilitar timer de renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verificar status
sudo systemctl status certbot.timer

# Testar renovação (dry-run)
sudo certbot renew --dry-run
```

### Passo 6: Atualizar Variáveis de Ambiente

Após configurar HTTPS, atualize o arquivo `.env`:

```bash
# Editar .env
nano .env
```

**Atualizar:**
```env
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
VITE_API_URL=https://seu-dominio.com/api
```

**Reiniciar containers para aplicar mudanças:**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

---

## 🌐 Configuração do Nginx

### Arquivo de Configuração Completo

O arquivo `nginx/habitus-forecast.conf` já está configurado com:

- ✅ Redirecionamento HTTP → HTTPS
- ✅ Configurações SSL modernas (TLS 1.2 e 1.3)
- ✅ Headers de segurança (HSTS, X-Frame-Options, etc.)
- ✅ Proxy reverso para backend Flask
- ✅ Servir arquivos estáticos do frontend
- ✅ Suporte a SPA routing (React Router)
- ✅ Cache de assets estáticos
- ✅ Timeouts e buffering configurados

### Personalização

Se precisar personalizar, edite `/etc/nginx/sites-available/habitus-forecast`:

```bash
sudo nano /etc/nginx/sites-available/habitus-forecast
```

**Após editar, sempre teste e recarregue:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Validação e Testes

### Passo 1: Testar Endpoints da API

```bash
# Health check
curl https://seu-dominio.com/api/health

# Deve retornar:
# {"status": "ok", "message": "Habitus Forecast API está funcionando"}
```

### Passo 2: Testar Frontend

1. Acesse `https://seu-dominio.com` no navegador
2. Verifique se a página carrega corretamente
3. Teste o login com credenciais padrão:
   - **Email**: `admin@habitus.com`
   - **Senha**: `admin123`

**⚠️ IMPORTANTE:** Altere a senha do admin após o primeiro login!

### Passo 3: Verificar Logs

```bash
# Ver logs do backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend | tail -50

# Ver logs do Nginx
sudo tail -f /var/log/nginx/habitus-forecast-access.log
sudo tail -f /var/log/nginx/habitus-forecast-error.log
```

### Passo 4: Verificar Status dos Containers

```bash
# Status dos containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Deve mostrar 2 containers rodando:
# - habitus-db (PostgreSQL)
# - habitus-backend (Flask)
```

### Passo 5: Verificar Recursos do Sistema

```bash
# Uso de CPU e memória
docker stats

# Espaço em disco
df -h

# Espaço usado pelo Docker
docker system df
```

---

## 📊 Monitoramento e Manutenção

### Configurar Monitoramento de Erros (Sentry)

1. Crie conta em https://sentry.io
2. Crie um novo projeto (Flask/Python)
3. Copie o DSN fornecido
4. Adicione ao arquivo `.env`:

```env
SENTRY_DSN=https://seu-dsn-do-sentry@sentry.io/projeto
```

5. Reinicie o backend:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Backup do Banco de Dados

#### Backup Manual

```bash
# Criar backup
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U habitus habitus_forecast < backup_20250102_120000.sql
```

#### Backup Automático (Cron)

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 2h da manhã
0 2 * * * cd /var/www/habitus-forecast-system && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db pg_dump -U habitus habitus_forecast > backups/backup_$(date +\%Y\%m\%d).sql && find backups/ -name "backup_*.sql" -mtime +7 -delete
```

**Criar diretório de backups:**

```bash
mkdir -p /var/www/habitus-forecast-system/backups
```

### Atualizações Futuras

```bash
# 1. Fazer backup do banco de dados
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup_antes_update_$(date +%Y%m%d).sql

# 2. Atualizar código
cd /var/www/habitus-forecast-system
git pull origin main

# 3. Rebuild do frontend (se necessário)
cd frontend
pnpm install --frozen-lockfile
export VITE_API_URL=https://seu-dominio.com/api
pnpm run build
cd ..

# 4. Rebuild e reiniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Executar migrações (se houver)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# 6. Verificar logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### Limpeza de Recursos Docker

```bash
# Limpar imagens não utilizadas
docker system prune -a

# Limpar volumes não utilizados (CUIDADO: pode remover dados!)
docker volume prune

# Ver uso de recursos
docker system df
```

---

## 🐛 Troubleshooting

### Problema: Container não inicia

**Verificar logs:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend
```

**Possíveis causas:**
- Variáveis de ambiente não configuradas
- Banco de dados não está acessível
- Porta 5000 já está em uso
- Erro nas migrações

**Solução:**
```bash
# Verificar variáveis de ambiente
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend env | grep -E "DATABASE_URL|SECRET_KEY"

# Verificar se porta está em uso
sudo lsof -i :5000

# Reiniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### Problema: Erro de conexão com banco de dados

**Verificar se banco está rodando:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps db
```

**Verificar logs do banco:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs db
```

**Verificar variáveis de ambiente:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend env | grep DATABASE
```

**Solução:**
```bash
# Reiniciar banco de dados
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart db

# Aguardar banco iniciar
sleep 5

# Testar conexão
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python -c "from sqlalchemy import create_engine; engine = create_engine('$DATABASE_URL'); engine.connect()"
```

### Problema: Frontend não carrega

**Verificar se build existe:**
```bash
ls -la backend/src/static/
```

**Verificar configuração do Nginx:**
```bash
sudo nginx -t
sudo cat /etc/nginx/sites-available/habitus-forecast | grep root
```

**Solução:**
```bash
# Rebuild do frontend
cd frontend
pnpm run build
cd ..

# Verificar se arquivos foram copiados
ls -la backend/src/static/index.html

# Reiniciar Nginx
sudo systemctl reload nginx
```

### Problema: Erro 502 Bad Gateway

**Causa:** Backend não está respondendo ou Nginx não consegue conectar.

**Verificar:**
```bash
# Verificar se backend está rodando
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps backend

# Testar backend diretamente
curl http://localhost:5000/api/health

# Verificar logs do backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend | tail -50
```

**Solução:**
```bash
# Reiniciar backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Aguardar iniciar
sleep 10

# Verificar novamente
curl http://localhost:5000/api/health
```

### Problema: Certificado SSL não renova

**Verificar timer:**
```bash
sudo systemctl status certbot.timer
```

**Testar renovação:**
```bash
sudo certbot renew --dry-run
```

**Renovar manualmente:**
```bash
sudo certbot renew
```

### Problema: Erro "No space left on device"

**Verificar espaço em disco:**
```bash
df -h
```

**Limpar recursos Docker:**
```bash
# Limpar imagens não utilizadas
docker system prune -a

# Limpar volumes não utilizados (CUIDADO!)
docker volume prune

# Limpar logs antigos
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=0
```

### Problema: Migrações falham

**Verificar logs:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend | grep -i migration
```

**Executar migrações manualmente:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

**Verificar histórico de migrações:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic history
```

---

## 🛠️ Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status dos containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Reiniciar todos os containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Parar todos os containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Iniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild e reiniciar
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Banco de Dados

```bash
# Conectar ao banco de dados
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U habitus habitus_forecast

# Listar tabelas
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db psql -U habitus habitus_forecast -c "\dt"

# Backup
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup.sql

# Restaurar
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U habitus habitus_forecast < backup.sql
```

### Migrações

```bash
# Executar migrações
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# Ver histórico
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic history

# Criar nova migration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic revision --autogenerate -m "descricao"
```

### Nginx

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/habitus-forecast-access.log
sudo tail -f /var/log/nginx/habitus-forecast-error.log
```

### Monitoramento

```bash
# Uso de recursos dos containers
docker stats

# Espaço em disco usado pelo Docker
docker system df

# Ver processos rodando
docker-compose -f docker-compose.yml -f docker-compose.prod.yml top
```

---

## ✅ Checklist Final de Deploy

Antes de considerar o deploy completo, verifique:

- [ ] Servidor preparado (Docker, Git, Node.js instalados)
- [ ] Repositório clonado em `/var/www/habitus-forecast-system`
- [ ] Arquivo `.env` configurado com todas as variáveis obrigatórias
- [ ] SECRET_KEY gerada e configurada (mínimo 32 caracteres)
- [ ] DATABASE_URL configurada corretamente
- [ ] CORS_ORIGINS configurado com domínio de produção
- [ ] VITE_API_URL configurada antes do build do frontend
- [ ] Frontend buildado e arquivos em `backend/src/static/`
- [ ] Containers Docker rodando (`docker-compose ps`)
- [ ] Migrações executadas com sucesso
- [ ] Health check respondendo (`/api/health`)
- [ ] Nginx instalado e configurado
- [ ] Certificado SSL obtido e configurado
- [ ] HTTPS funcionando (`https://seu-dominio.com`)
- [ ] Redirecionamento HTTP → HTTPS funcionando
- [ ] Frontend carregando corretamente
- [ ] Login funcionando (credenciais padrão)
- [ ] Backup do banco de dados configurado
- [ ] Monitoramento configurado (Sentry, se aplicável)
- [ ] Logs sendo gerados corretamente
- [ ] Firewall configurado (portas 80, 443 abertas)

---

## 📚 Documentação Relacionada

- `README.md` - Documentação geral do projeto
- `docs/API.md` - Documentação da API
- `docs/SECURITY.md` - Guia de segurança
- `docs/MONITORAMENTO.md` - Guia de monitoramento
- `docs/HTTPS_SETUP.md` - Guia detalhado de HTTPS
- `env.production.example` - Exemplo de variáveis de ambiente

---

## 🆘 Suporte

Se encontrar problemas não cobertos neste guia:

1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação em `docs/`
3. Abra uma issue no GitHub
4. Verifique o status dos serviços: `docker-compose ps`

---

**Última atualização:** 2025-01-XX  
**Versão do guia:** 2.0  
**Mantido por:** Equipe Habitus Forecast
