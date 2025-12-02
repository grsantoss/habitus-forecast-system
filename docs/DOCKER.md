# Guia Docker - Habitus Forecast

Este documento descreve como usar Docker para desenvolvimento e produção.

## Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Estrutura Docker

```
habitus-forecast-system/
├── docker-compose.yml          # Configuração principal
├── docker-compose.prod.yml      # Overrides para produção
├── backend/
│   ├── Dockerfile              # Imagem do backend
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile              # Build do frontend
│   └── .dockerignore
└── scripts/
    ├── docker-build.sh          # Script de build
    ├── docker-dev.sh            # Script de desenvolvimento
    └── docker-prod.sh           # Script de produção
```

## Desenvolvimento

### Início Rápido

```bash
# Opção 1: Usar script automatizado
bash scripts/docker-dev.sh
# Windows: .\scripts\docker-dev.ps1

# Opção 2: Manual
docker-compose up -d --build
```

### Serviços Disponíveis

- **Backend API**: http://localhost:5000
- **Frontend Dev**: http://localhost:5173 (se habilitado com profile `dev`)
- **PostgreSQL**: localhost:5432

### Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Executar comandos no container
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_db.py

# Acessar shell do container
docker-compose exec backend sh

# Parar containers
docker-compose down

# Parar e remover volumes (⚠️ apaga dados)
docker-compose down -v

# Rebuild após mudanças
docker-compose up -d --build
```

### Desenvolvimento com Hot Reload

O código do backend está montado como volume, então mudanças são refletidas automaticamente. Para o frontend, use o profile `dev`:

```bash
docker-compose --profile dev up -d frontend
```

## Produção

### Build e Deploy

```bash
# Opção 1: Script automatizado
bash scripts/docker-prod.sh

# Opção 2: Manual
# 1. Build do frontend
cd frontend
pnpm install
pnpm run build
cd ..

# 2. Build das imagens
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 3. Iniciar serviços
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Variáveis de Ambiente para Produção

Crie um arquivo `.env` na raiz:

```env
# PostgreSQL
POSTGRES_DB=habitus_forecast
POSTGRES_USER=habitus
POSTGRES_PASSWORD=senha_segura_aqui
POSTGRES_PORT=5432

# Backend
SECRET_KEY=sua-chave-secreta-forte-aqui
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
WORKERS=4
CORS_ORIGINS=https://seu-dominio.com
MAX_CONTENT_LENGTH=16777216
```

### Health Checks

```bash
# Verificar saúde dos containers
docker-compose ps

# Health check do backend
curl http://localhost:5000/api/health
```

## Build Manual

### Backend

```bash
cd backend
docker build -t habitus-backend:latest -f Dockerfile .
```

### Frontend

```bash
cd frontend
docker build -t habitus-frontend:builder --target builder -f Dockerfile .
```

## Volumes Docker

Os seguintes volumes são criados:

- `postgres_data`: Dados do PostgreSQL
- `backend_logs`: Logs do backend
- `frontend-build`: Build do frontend (temporário)

### Backup de Dados

```bash
# Backup do PostgreSQL
docker-compose exec db pg_dump -U habitus habitus_forecast > backup.sql

# Restaurar backup
docker-compose exec -T db psql -U habitus habitus_forecast < backup.sql
```

## Troubleshooting

### Erro: "Port already in use"

```bash
# Verificar o que está usando a porta
sudo lsof -i :5000
# Ou no Windows:
netstat -ano | findstr :5000

# Parar containers conflitantes
docker-compose down
```

### Erro: "Cannot connect to database"

1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker-compose ps db
   ```

2. Verifique as variáveis de ambiente:
   ```bash
   docker-compose exec backend env | grep DATABASE
   ```

3. Verifique os logs:
   ```bash
   docker-compose logs db
   ```

### Erro: "Frontend build not found"

Execute o build do frontend antes de iniciar:

```bash
cd frontend
pnpm install
pnpm run build
cd ..
```

### Limpar Tudo

```bash
# Parar e remover containers, volumes e imagens
docker-compose down -v --rmi all

# Limpar sistema Docker (⚠️ remove tudo)
docker system prune -a --volumes
```

## Otimizações

### Cache de Build

O Docker usa cache de camadas. Para forçar rebuild completo:

```bash
docker-compose build --no-cache
```

### Multi-stage Build

O frontend usa multi-stage build para reduzir o tamanho da imagem final.

### Health Checks

Todos os serviços têm health checks configurados para garantir disponibilidade.

## Integração com CI/CD

### GitHub Actions

```yaml
- name: Build and push Docker images
  run: |
    docker-compose build
    docker-compose push
```

### Deploy Automático

Configure seu servidor para fazer pull e restart:

```bash
git pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Segurança

- ✅ Containers rodam como usuário não-root
- ✅ Secrets via variáveis de ambiente
- ✅ Health checks configurados
- ✅ Volumes apenas para dados necessários
- ✅ Network isolada entre containers

## Próximos Passos

- Configurar Nginx como reverse proxy
- Adicionar SSL/TLS com Let's Encrypt
- Configurar backup automático
- Monitoramento com Prometheus/Grafana

