# Guia de Deploy via SSH - Habitus Forecast

Este guia detalha como configurar deploy automático via SSH usando GitHub Actions.

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu/Debian recomendado)
- Acesso SSH ao servidor
- Domínio apontando para o servidor (opcional, mas recomendado)
- Repositório GitHub configurado

## 🚀 Passo 1: Preparar Servidor

### 1.1. Executar Script de Setup

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Baixar e executar script de setup
curl -fsSL https://raw.githubusercontent.com/seu-usuario/habitus-forecast-system/main/scripts/setup-server.sh | sudo bash

# OU executar localmente se já tiver o repositório
sudo bash scripts/setup-server.sh
```

O script instala:
- Docker
- Docker Compose
- Git
- Node.js e pnpm

### 1.2. Clonar Repositório

```bash
# Criar diretório
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www

# Clonar repositório
cd /var/www
git clone https://github.com/seu-usuario/habitus-forecast-system.git
cd habitus-forecast-system
```

### 1.3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.production.example .env

# Editar com suas configurações
nano .env
```

**Variáveis importantes:**
- `SECRET_KEY`: Gere com `python3 -c "import secrets; print(secrets.token_hex(32))"`
- `POSTGRES_PASSWORD`: Senha forte para PostgreSQL
- `DATABASE_URL`: Usar `db` como host (nome do serviço Docker)
- `CORS_ORIGINS`: Seus domínios de produção

### 1.4. Criar Diretórios Necessários

```bash
mkdir -p backend/uploads backend/logs backend/database
chmod -R 755 backend/uploads backend/logs
```

## 🔐 Passo 2: Configurar GitHub Secrets

Acesse: `Settings > Secrets and variables > Actions > New repository secret`

### Secrets Necessários:

1. **SERVER_HOST**
   ```
   seu-servidor.com
   ```

2. **SERVER_USER**
   ```
   usuario-ssh
   ```

3. **SSH_PRIVATE_KEY**
   ```bash
   # Gerar chave SSH no seu computador local
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
   
   # Copiar chave pública para o servidor
   ssh-copy-id -i ~/.ssh/github_actions_deploy.pub usuario@seu-servidor.com
   
   # Copiar chave PRIVADA completa para o GitHub Secret
   cat ~/.ssh/github_actions_deploy
   # Copie TODO o conteúdo (incluindo -----BEGIN e -----END)
   ```

4. **SSH_PORT** (opcional)
   ```
   22
   ```

## ⚙️ Passo 3: Ajustar Workflow

O arquivo `.github/workflows/deploy.yml` já está configurado, mas você pode ajustar:

### 3.1. Caminho da Aplicação

Se sua aplicação estiver em outro caminho, edite a variável `SERVER_APP_DIR` no workflow ou ajuste diretamente:

```yaml
APP_DIR="${SERVER_APP_DIR:-/var/www/habitus-forecast-system}"
```

### 3.2. Branch de Deploy

Por padrão, deploy acontece em `main` ou `master`. Para mudar:

```yaml
if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
```

## 🧪 Passo 4: Primeiro Deploy Manual

Antes de testar o deploy automático, faça um deploy manual:

```bash
# No servidor
cd /var/www/habitus-forecast-system

# Executar script de deploy
bash scripts/deploy-server.sh

# OU manualmente:
git pull origin main
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Verificar Funcionamento

```bash
# Health check
curl http://localhost:5000/api/health

# Ver logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Ver status dos containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

## 🚀 Passo 5: Testar Deploy Automático

1. Faça uma mudança pequena no código
2. Commit e push para `main`:
   ```bash
   git add .
   git commit -m "Teste deploy automático"
   git push origin main
   ```
3. Acesse GitHub Actions: `Actions > Deploy to Production`
4. Verifique se o deploy foi executado com sucesso

## 🔧 Configuração Adicional

### Nginx como Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/habitus-forecast
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/habitus-forecast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## 📊 Monitoramento

### Ver Logs

```bash
# Logs do backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Logs do banco
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f db

# Todos os logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Verificar Status

```bash
# Status dos containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Uso de recursos
docker stats

# Health check
curl http://localhost:5000/api/health
```

## 🔄 Atualização Manual

Se precisar atualizar manualmente:

```bash
cd /var/www/habitus-forecast-system
bash scripts/deploy-server.sh
```

## 🐛 Troubleshooting

### Erro: "Permission denied"

```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
# Fazer logout e login novamente
```

### Erro: "Cannot connect to database"

Verifique:
1. Container do banco está rodando: `docker-compose ps db`
2. Variável `DATABASE_URL` está correta no `.env`
3. Senha do PostgreSQL está correta

### Erro: "Port already in use"

```bash
# Ver o que está usando a porta
sudo lsof -i :5000

# Parar containers antigos
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Deploy falha no GitHub Actions

1. Verificar logs do workflow
2. Verificar se secrets estão configurados corretamente
3. Testar conexão SSH manualmente:
   ```bash
   ssh -i ~/.ssh/github_actions_deploy usuario@seu-servidor.com
   ```

## 📝 Checklist Final

- [ ] Servidor preparado (Docker, Git instalados)
- [ ] Repositório clonado no servidor
- [ ] Arquivo `.env` configurado
- [ ] Diretórios criados (uploads, logs)
- [ ] GitHub Secrets configurados
- [ ] Chave SSH adicionada ao servidor
- [ ] Primeiro deploy manual funcionando
- [ ] Deploy automático testado
- [ ] Nginx configurado (opcional)
- [ ] SSL configurado (opcional)

## 🔗 Links Úteis

- [Documentação Docker](https://docs.docker.com/)
- [GitHub Actions SSH](https://github.com/appleboy/ssh-action)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

