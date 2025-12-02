# Deploy em Produção - Habitus Forecast

## 🚀 Deploy Automático via SSH (GitHub Actions)

A aplicação está configurada para deploy automático via SSH quando houver push para `main` ou `master`.

### Configuração Rápida

1. **Preparar Servidor:**
   ```bash
   sudo bash scripts/setup-server.sh
   ```

2. **Configurar GitHub Secrets:**
   - `SERVER_HOST`: IP ou domínio do servidor
   - `SERVER_USER`: Usuário SSH
   - `SSH_PRIVATE_KEY`: Chave privada SSH
   - `SSH_PORT`: Porta SSH (opcional, padrão: 22)

3. **Configurar Variáveis de Ambiente:**
   ```bash
   cp .env.production.example .env
   nano .env  # Ajustar valores
   ```

4. **Primeiro Deploy Manual:**
   ```bash
   bash scripts/deploy-server.sh
   ```

5. **Testar Deploy Automático:**
   - Fazer push para `main`
   - Verificar em `Actions` no GitHub

### Documentação Completa

Consulte `docs/DEPLOY_SSH.md` para guia detalhado.

## 📋 Arquivos de Deploy

- `.github/workflows/deploy.yml` - Workflow GitHub Actions
- `scripts/deploy-server.sh` - Script de deploy manual
- `scripts/setup-server.sh` - Script de setup do servidor
- `scripts/backup-db.sh` - Script de backup do banco
- `.env.production.example` - Exemplo de variáveis de ambiente
- `docker-compose.prod.yml` - Override para produção

## 🔧 Comandos Úteis

### Deploy Rápido

```bash
# Deploy completo (uma linha)
cd /var/www/habitus-forecast-system && git pull && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build && docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# Ou usar script
bash scripts/deploy-server.sh
```

### Monitoramento

```bash
# Ver logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Ver status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Health check
curl http://localhost:5000/api/health
```

### Manutenção

```bash
# Backup do banco
bash scripts/backup-db.sh

# Reiniciar containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Parar aplicação
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

**📚 Para lista completa de comandos:** Veja `docs/COMANDOS_PRODUCAO.md` ou `COMANDOS_PRODUCAO_RAPIDO.md`

## 📚 Documentação Adicional

- `docs/DEPLOY_SSH.md` - Guia completo de deploy SSH
- `docs/DOCKER.md` - Documentação Docker
- `docs/HTTPS_SETUP.md` - Configuração HTTPS/SSL
- `docs/CI_CD.md` - CI/CD com GitHub Actions

