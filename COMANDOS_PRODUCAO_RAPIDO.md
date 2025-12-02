# Comandos Rápidos para Produção

## 🚀 Deploy Rápido (Docker)

```bash
# 1. Conectar ao servidor
ssh usuario@seu-servidor.com

# 2. Ir para diretório da aplicação
cd /var/www/habitus-forecast-system

# 3. Atualizar código
git pull origin main

# 4. Deploy completo
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 5. Migrações
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# 6. Verificar
curl http://localhost:5000/api/health
```

## 📊 Monitoramento Rápido

```bash
# Ver logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend

# Ver status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Health check
curl http://localhost:5000/api/health
```

## 🔄 Reiniciar

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

## 📦 Backup

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec db pg_dump -U habitus habitus_forecast > backup_$(date +%Y%m%d).sql
```

## 🛑 Parar

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

---

**Para comandos detalhados, veja:** `docs/COMANDOS_PRODUCAO.md`

