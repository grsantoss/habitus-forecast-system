# Guia Completo: Instalação em Produção - Habitus Forecast

**Para Leigos - Passo a Passo Detalhado**

Este guia vai te ajudar a instalar e configurar a aplicação Habitus Forecast em um servidor Linux (Ubuntu/Debian) do zero, incluindo a configuração para deploy automático via GitHub Actions.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Parte 1: Preparar o Servidor](#parte-1-preparar-o-servidor)
3. [Parte 2: Configurar SSH para GitHub Actions](#parte-2-configurar-ssh-para-github-actions)
4. [Parte 3: Instalar a Aplicação](#parte-3-instalar-a-aplicação)
5. [Parte 4: Configurar Variáveis de Ambiente](#parte-4-configurar-variáveis-de-ambiente)
6. [Parte 5: Primeiro Deploy](#parte-5-primeiro-deploy)
7. [Parte 6: Verificar Funcionamento](#parte-6-verificar-funcionamento)
8. [Parte 7: Configurar GitHub Secrets](#parte-7-configurar-github-secrets)
9. [Troubleshooting](#troubleshooting)

---

## 📦 Pré-requisitos

Antes de começar, você precisa ter:

- ✅ Um servidor Linux (Ubuntu 20.04+ ou Debian 11+)
- ✅ Acesso SSH ao servidor (usuário com permissões sudo)
- ✅ Um repositório GitHub com o código da aplicação
- ✅ Um domínio apontando para o servidor (opcional, mas recomendado)

**Informações que você vai precisar:**
- IP ou domínio do servidor
- Usuário SSH do servidor (ex: `ubuntu`, `root`, `deploy`)
- Senha do usuário SSH ou chave SSH já configurada

---

## 🖥️ Parte 1: Preparar o Servidor

### Passo 1.1: Conectar ao Servidor

No seu computador local, abra o terminal (PowerShell no Windows, Terminal no Mac/Linux) e conecte-se ao servidor:

```bash
ssh usuario@seu-servidor.com
```

**Exemplo:**
```bash
ssh ubuntu@192.168.1.100
# ou
ssh root@meuservidor.com
```

**Se pedir senha:** Digite a senha do usuário e pressione Enter.

**Se pedir confirmação:** Digite `yes` e pressione Enter.

---

### Passo 1.2: Atualizar o Sistema

Após conectar, atualize o sistema operacional:

```bash
sudo apt update
sudo apt upgrade -y
```

**O que isso faz:** Atualiza a lista de pacotes e instala atualizações de segurança.

**Tempo estimado:** 5-10 minutos

---

### Passo 1.3: Instalar Docker

Docker é necessário para rodar a aplicação em containers.

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh
```

**Verificar se instalou:**
```bash
docker --version
```

Você deve ver algo como: `Docker version 24.x.x`

---

### Passo 1.4: Instalar Docker Compose

Docker Compose é usado para gerenciar múltiplos containers.

```bash
# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Verificar se instalou:**
```bash
docker-compose --version
```

Você deve ver algo como: `Docker Compose version v2.x.x`

---

### Passo 1.5: Instalar Git

Git é necessário para baixar o código do GitHub.

```bash
sudo apt install git -y
```

**Verificar se instalou:**
```bash
git --version
```

---

### Passo 1.6: Instalar Node.js e pnpm

Necessário para fazer o build do frontend.

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm
sudo npm install -g pnpm
```

**Verificar se instalou:**
```bash
node --version
pnpm --version
```

---

### Passo 1.7: Adicionar Usuário ao Grupo Docker

Isso permite usar Docker sem `sudo`:

```bash
# Substitua 'ubuntu' pelo seu usuário se for diferente
sudo usermod -aG docker $USER

# OU se souber o nome do usuário:
sudo usermod -aG docker ubuntu
```

**IMPORTANTE:** Faça logout e login novamente para aplicar a mudança:

```bash
exit
```

Depois conecte novamente:
```bash
ssh usuario@seu-servidor.com
```

**Verificar se funcionou:**
```bash
docker ps
```

Se não pedir senha, está funcionando! ✅

---

### Passo 1.8: Criar Diretório para a Aplicação

```bash
# Criar diretório
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
```

---

## 🔐 Parte 2: Configurar SSH para GitHub Actions

Para o GitHub Actions fazer deploy automático, precisamos configurar autenticação SSH.

### Passo 2.1: Gerar Chave SSH no Servidor

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Quando pedir:
# - Passphrase: Pressione Enter (deixe em branco)
# - Confirm passphrase: Pressione Enter novamente
```

**O que isso cria:**
- `~/.ssh/github_actions_deploy` - Chave privada (NUNCA compartilhe!)
- `~/.ssh/github_actions_deploy.pub` - Chave pública (pode compartilhar)

---

### Passo 2.2: Adicionar Chave Pública ao Servidor

```bash
# Ver a chave pública
cat ~/.ssh/github_actions_deploy.pub

# Adicionar ao authorized_keys
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Ajustar permissões (IMPORTANTE!)
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

---

### Passo 2.3: Obter Chave Privada (para GitHub Secrets)

```bash
# Ver a chave privada completa
cat ~/.ssh/github_actions_deploy
```

**Copie TODO o conteúdo** (incluindo `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`).

**Você vai precisar disso depois** para adicionar no GitHub Secrets.

---

## 📥 Parte 3: Instalar a Aplicação

### Passo 3.1: Clonar o Repositório

```bash
# Ir para o diretório
cd /var/www

# Clonar repositório (substitua pela URL do seu repositório)
git clone https://github.com/seu-usuario/habitus-forecast-system.git

# Entrar no diretório
cd habitus-forecast-system
```

**Se o repositório for privado**, você pode precisar configurar autenticação:

```bash
# Opção 1: Usar token pessoal
git clone https://SEU_TOKEN@github.com/seu-usuario/habitus-forecast-system.git

# Opção 2: Configurar SSH (mais seguro)
# Adicione sua chave SSH ao GitHub primeiro
```

---

### Passo 3.2: Criar Diretórios Necessários

```bash
# Criar diretórios para uploads e logs
mkdir -p backend/uploads backend/logs backend/database
chmod -R 755 backend/uploads backend/logs
```

---

## ⚙️ Parte 4: Configurar Variáveis de Ambiente

### Passo 4.1: Copiar Arquivo de Exemplo

```bash
# Copiar arquivo de exemplo
cp env.production.example .env

# Editar o arquivo
nano .env
```

**Como usar o editor nano:**
- Use as setas para navegar
- Digite para editar
- `Ctrl + O` para salvar (depois Enter)
- `Ctrl + X` para sair

---

### Passo 4.2: Configurar Variáveis Importantes

Abra o arquivo `.env` e configure as seguintes variáveis:

#### 1. Gerar SECRET_KEY

No servidor, execute:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Copie o resultado** e cole no `.env` na linha `SECRET_KEY=`

#### 2. Configurar PostgreSQL

No arquivo `.env`, encontre e altere:

```env
POSTGRES_DB=habitus_forecast
POSTGRES_USER=habitus
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI  # Escolha uma senha forte!
POSTGRES_PORT=5432
```

**Importante:** Use a mesma senha em `POSTGRES_PASSWORD` e na `DATABASE_URL`.

#### 3. Configurar DATABASE_URL

```env
DATABASE_URL=postgresql://habitus:SUA_SENHA_FORTE_AQUI@db:5432/habitus_forecast
```

**Substitua `SUA_SENHA_FORTE_AQUI`** pela mesma senha que você usou em `POSTGRES_PASSWORD`.

#### 4. Configurar CORS_ORIGINS

```env
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
```

**Se não tiver domínio ainda**, use o IP:

```env
CORS_ORIGINS=http://SEU_IP:5000
```

#### 5. Exemplo Completo do .env

```env
# PostgreSQL
POSTGRES_DB=habitus_forecast
POSTGRES_USER=habitus
POSTGRES_PASSWORD=MinhaSenh@SuperSegura123!
POSTGRES_PORT=5432

# Backend
SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
DATABASE_URL=postgresql://habitus:MinhaSenh@SuperSegura123!@db:5432/habitus_forecast
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
WORKERS=4
CORS_ORIGINS=https://meuservidor.com,https://www.meuservidor.com
MAX_CONTENT_LENGTH=16777216
```

**Salve o arquivo:** `Ctrl + O`, Enter, `Ctrl + X`

---

## 🚀 Parte 5: Primeiro Deploy

### Passo 5.1: Iniciar os Containers

```bash
# Certifique-se de estar no diretório do projeto
cd /var/www/habitus-forecast-system

# Iniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

**O que isso faz:**
- Baixa as imagens Docker necessárias
- Cria e inicia os containers (banco de dados, backend, frontend)
- Faz o build da aplicação

**Tempo estimado:** 5-15 minutos na primeira vez

---

### Passo 5.2: Verificar Status dos Containers

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

**Você deve ver 3 containers rodando:**
- `habitus-forecast-system-db-1` (banco de dados)
- `habitus-forecast-system-backend-1` (backend)
- `habitus-forecast-system-frontend-1` (frontend)

Se algum estiver com status diferente de "Up", veja os logs:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs nome-do-container
```

---

### Passo 5.3: Executar Migrações do Banco de Dados

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

**O que isso faz:** Cria as tabelas no banco de dados.

---

### Passo 5.4: Popular Dados Iniciais (Opcional)

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python scripts/seed_db.py
```

**O que isso faz:** Cria usuário admin padrão e categorias financeiras iniciais.

**Credenciais padrão do admin:**
- Email: `admin@habitus.com`
- Senha: `admin123`

**⚠️ IMPORTANTE:** Altere a senha após o primeiro login!

---

## ✅ Parte 6: Verificar Funcionamento

### Passo 6.1: Verificar Health Check

```bash
curl http://localhost:5000/api/health
```

**Resposta esperada:**
```json
{"status": "ok", "message": "Habitus Forecast API está funcionando"}
```

---

### Passo 6.2: Ver Logs

```bash
# Ver logs do backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Ver logs de todos os containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

**Para sair dos logs:** Pressione `Ctrl + C`

---

### Passo 6.3: Acessar a Aplicação

**Se tiver domínio configurado:**
- Acesse: `https://seu-dominio.com`

**Se não tiver domínio:**
- Acesse: `http://SEU_IP:5000`

**Se não conseguir acessar**, verifique o firewall:

```bash
# Verificar se porta 5000 está aberta
sudo ufw status

# Se não estiver, abrir porta
sudo ufw allow 5000/tcp
sudo ufw reload
```

---

## 🔑 Parte 7: Configurar GitHub Secrets

Agora vamos configurar o GitHub para fazer deploy automático.

### Passo 7.1: Acessar GitHub Secrets

1. Vá para seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral esquerdo, vá em **Security**
4. Clique em **Secrets and variables** ▶
5. Clique em **Actions**
6. Clique em **New repository secret**

---

### Passo 7.2: Adicionar Secrets

Adicione os seguintes secrets (um por vez):

#### Secret 1: SSH_PRIVATE_KEY

- **Name:** `SSH_PRIVATE_KEY`
- **Secret:** Cole a chave privada que você copiou no **Passo 2.3**
  - Deve incluir `-----BEGIN OPENSSH PRIVATE KEY-----` no início
  - E `-----END OPENSSH PRIVATE KEY-----` no final
- Clique em **Add secret**

#### Secret 2: SERVER_HOST

- **Name:** `SERVER_HOST`
- **Secret:** IP ou domínio do seu servidor
  - Exemplo: `192.168.1.100` ou `meuservidor.com`
- Clique em **Add secret**

#### Secret 3: SERVER_USER

- **Name:** `SERVER_USER`
- **Secret:** Usuário SSH do servidor
  - Exemplo: `ubuntu`, `root`, `deploy`
- Clique em **Add secret**

#### Secret 4: SSH_PORT (Opcional)

- **Name:** `SSH_PORT`
- **Secret:** `22` (porta padrão SSH)
- Clique em **Add secret**

---

### Passo 7.3: Testar Deploy Automático

1. Faça uma pequena alteração no código localmente
2. Commit e push:

```bash
git add .
git commit -m "test: teste deploy automático"
git push origin main
```

3. Vá para **GitHub → Actions**
4. Veja o workflow **"Deploy to Production"** executando
5. Aguarde conclusão (5-10 minutos)

**Se der erro**, veja os logs clicando no workflow.

---

## 🐛 Troubleshooting

### Problema: "Permission denied" ao usar Docker

**Solução:**
```bash
sudo usermod -aG docker $USER
# Faça logout e login novamente
```

---

### Problema: Container não inicia

**Verificar logs:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs nome-do-container
```

**Reiniciar containers:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

---

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

---

### Problema: Porta 5000 já está em uso

**Verificar o que está usando a porta:**
```bash
sudo lsof -i :5000
# ou
sudo netstat -tulpn | grep 5000
```

**Parar processo ou mudar porta no .env**

---

### Problema: GitHub Actions não consegue conectar

**Verificar:**
1. Secrets estão configurados corretamente?
2. Chave SSH pública está no servidor?
3. Servidor está acessível pela internet?
4. Firewall permite conexão SSH?

**Testar conexão manualmente:**
```bash
# No seu computador local
ssh -i ~/.ssh/github_actions_deploy usuario@seu-servidor.com
```

---

### Problema: Erro "No space left on device"

**Limpar espaço:**
```bash
# Limpar imagens Docker não usadas
docker system prune -a

# Limpar logs antigos
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=0
```

---

## 📚 Comandos Úteis

### Ver Status dos Containers
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Ver Logs
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### Reiniciar Aplicação
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### Parar Aplicação
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Atualizar Manualmente
```bash
cd /var/www/habitus-forecast-system
git pull origin main
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Backup do Banco de Dados
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup_$(date +%Y%m%d).sql
```

### Restaurar Backup
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T db psql -U habitus habitus_forecast < backup_20250102.sql
```

---

## ✅ Checklist Final

- [ ] Servidor preparado (Docker, Git, Node.js instalados)
- [ ] Chave SSH gerada e configurada
- [ ] Repositório clonado
- [ ] Arquivo `.env` configurado
- [ ] Containers rodando
- [ ] Migrações executadas
- [ ] Health check funcionando
- [ ] GitHub Secrets configurados
- [ ] Deploy automático testado

---

## 🎉 Pronto!

Sua aplicação está rodando em produção! 

A partir de agora, qualquer push para a branch `main` no GitHub vai fazer deploy automático.

**Próximos passos recomendados:**
- Configurar domínio e HTTPS (veja `docs/HTTPS_SETUP.md`)
- Configurar backup automático do banco de dados
- Configurar monitoramento (Sentry, UptimeRobot, etc.)

---

**Última atualização:** 2025-01-XX

**Dúvidas?** Consulte a documentação em `docs/` ou abra uma issue no GitHub.

