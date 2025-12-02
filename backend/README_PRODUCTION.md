# Fase 3: Configuração de Produção - Concluída ✅

## O que foi implementado

### 1. Servidor WSGI (Gunicorn)
- ✅ `gunicorn==21.2.0` adicionado ao `requirements.txt`
- ✅ `wsgi.py` criado - ponto de entrada WSGI
- ✅ `gunicorn_config.py` criado - configurações otimizadas
- ✅ `Procfile` criado - para plataformas PaaS (Railway, Render, Heroku)

### 2. Configuração de Produção
- ✅ `main.py` atualizado para usar variáveis de ambiente
- ✅ Removido código hardcoded
- ✅ Suporte para desenvolvimento e produção

### 3. Build do Frontend
- ✅ `vite.config.js` configurado para build em `backend/src/static`
- ✅ Scripts de build criados:
  - `frontend/build.sh` (Linux/Mac)
  - `frontend/build.ps1` (Windows)

### 4. Scripts de Deploy
- ✅ `scripts/start_production.sh` - Iniciar em produção (Linux/Mac)
- ✅ `scripts/start_production.ps1` - Iniciar em produção (Windows)

### 5. Documentação
- ✅ `docs/DEPLOY.md` - Guia completo de deploy
- ✅ Instruções para múltiplas plataformas (VPS, PaaS, Docker)

## Como Usar

### Desenvolvimento Local

```bash
# Backend
cd backend
python src/main.py

# Frontend (em outro terminal)
cd frontend
pnpm run dev
```

### Produção Local com Gunicorn

```bash
# 1. Build do frontend
cd frontend
pnpm run build

# 2. Iniciar backend com Gunicorn
cd ../backend
gunicorn --config gunicorn_config.py wsgi:application

# Ou use o script:
bash scripts/start_production.sh
# Windows: .\scripts\start_production.ps1
```

### Deploy em Plataforma PaaS

1. Configure variáveis de ambiente na plataforma
2. O `Procfile` será detectado automaticamente
3. Deploy automático a cada push

### Deploy em VPS

Siga as instruções em `docs/DEPLOY.md` seção "Opção 4: Deploy em VPS".

## Estrutura de Arquivos

```
backend/
├── wsgi.py                 # Ponto de entrada WSGI
├── gunicorn_config.py      # Configurações Gunicorn
├── Procfile                # Para PaaS
├── scripts/
│   ├── start_production.sh
│   └── start_production.ps1
└── docs/
    └── DEPLOY.md           # Guia completo

frontend/
├── vite.config.js          # Configurado para build em backend/src/static
├── build.sh
└── build.ps1
```

## Variáveis de Ambiente para Produção

```env
SECRET_KEY=sua-chave-secreta-forte
DATABASE_URL=postgresql://user:pass@host:5432/db
FLASK_ENV=production
FLASK_DEBUG=False
CORS_ORIGINS=https://seu-dominio.com
PORT=5000
WORKERS=4
```

## Comandos Úteis

```bash
# Build frontend
cd frontend && pnpm run build

# Iniciar produção
cd backend && gunicorn --config gunicorn_config.py wsgi:application

# Ver logs
tail -f logs/access.log
tail -f logs/error.log

# Verificar status
curl http://localhost:5000/api/health
```

## Próximos Passos

- Fase 4: Containerização com Docker
- Fase 5: GitHub Actions CI/CD
- Fase 6: Segurança e Monitoramento

