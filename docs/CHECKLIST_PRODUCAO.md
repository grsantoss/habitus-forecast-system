# ✅ Checklist de Produção - Habitus Forecast

Este documento lista todas as correções implementadas para deixar a aplicação pronta para produção.

## 🔒 Correções Críticas Implementadas

### ✅ 1. SECRET_KEY Configurada via Variável de Ambiente
- **Arquivo**: `backend/src/main.py`
- **Status**: ✅ Implementado
- **Mudança**: SECRET_KEY agora vem de `os.getenv('SECRET_KEY')`
- **Validação**: Erro em produção se não configurada
- **Ação necessária**: Configurar `SECRET_KEY` no `.env` de produção

### ✅ 2. CORS Configurado via Variável de Ambiente
- **Arquivo**: `backend/src/main.py`
- **Status**: ✅ Implementado
- **Mudança**: CORS origins agora vem de `os.getenv('CORS_ORIGINS')`
- **Ação necessária**: Configurar `CORS_ORIGINS` no `.env` de produção

### ✅ 3. URLs Hardcoded Removidas do Frontend
- **Arquivos corrigidos**:
  - ✅ `frontend/src/components/Dashboard.jsx` (linha 330)
  - ✅ `frontend/src/components/Settings.jsx` (5 ocorrências)
  - ✅ `frontend/src/components/DataUpload.jsx` (1 ocorrência)
- **Status**: ✅ Implementado
- **Mudança**: Todas as URLs agora usam `import.meta.env.VITE_API_URL`
- **Ação necessária**: Configurar `VITE_API_URL` no `.env` do frontend antes do build

### ✅ 4. Security Headers Configurados
- **Arquivo**: `backend/src/main.py`
- **Status**: ✅ Implementado
- **Mudança**: `setup_security_headers(app)` agora é chamado
- **Benefício**: Headers de segurança HTTP configurados automaticamente

### ✅ 5. Rate Limiting Configurado
- **Arquivo**: `backend/src/main.py`
- **Status**: ✅ Implementado
- **Mudança**: `setup_rate_limiting(app)` agora é chamado
- **Benefício**: Proteção contra abuso de API

### ✅ 6. Timeout do Gunicorn Aumentado
- **Arquivo**: `backend/gunicorn_config.py`
- **Status**: ✅ Implementado
- **Mudança**: Timeout padrão aumentado de 120s para 300s (5 minutos)
- **Benefício**: Suporta uploads grandes de até 16MB

### ✅ 7. Health Check Endpoint
- **Arquivo**: `backend/src/main.py`
- **Status**: ✅ Já existia
- **Endpoint**: `/api/health`
- **Retorno**: `{'status': 'ok', 'message': 'Habitus Forecast API está funcionando'}`

### ✅ 8. Migrações do Banco de Dados
- **Arquivo**: `backend/migrations/versions/ac814967bae3_add_relatorios_table.py`
- **Status**: ✅ Criada e pronta
- **Ação necessária**: Será executada automaticamente no deploy via `docker-compose.prod.yml`

## 📋 Variáveis de Ambiente Necessárias

### Backend (.env na raiz do projeto)

```env
# OBRIGATÓRIAS
SECRET_KEY=sua-chave-secreta-forte-aqui  # Gerar com: python3 -c "import secrets; print(secrets.token_hex(32))"
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ORIGINS=https://app.habitusforecast.com.br

# OPCIONAIS (com valores padrão)
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
WORKERS=4
TIMEOUT=300
MAX_CONTENT_LENGTH=16777216
```

### Frontend (.env no diretório frontend/)

```env
# OBRIGATÓRIA para produção
VITE_API_URL=https://app.habitusforecast.com.br/api

# Para desenvolvimento local:
# VITE_API_URL=http://localhost:5000/api
```

## 🚀 Processo de Deploy

### 1. Preparar Variáveis de Ambiente

```bash
# Backend
cp env.production.example .env
nano .env  # Editar com valores reais

# Frontend
cd frontend
cp .env.example .env
nano .env  # Configurar VITE_API_URL
cd ..
```

### 2. Build do Frontend

```bash
cd frontend
export VITE_API_URL=https://app.habitusforecast.com.br/api  # Linux/Mac
# OU
$env:VITE_API_URL="https://app.habitusforecast.com.br/api"  # Windows PowerShell

pnpm install
pnpm run build
cd ..
```

### 3. Deploy com Docker

```bash
# Opção 1: Script automatizado
bash scripts/docker-prod.sh

# Opção 2: Manual
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Verificar Migrações

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 5. Verificar Saúde da Aplicação

```bash
curl https://app.habitusforecast.com.br/api/health
# Deve retornar: {"status": "ok", "message": "Habitus Forecast API está funcionando"}
```

## ✅ Checklist Final Antes do Deploy

- [ ] SECRET_KEY configurada no `.env` (backend)
- [ ] CORS_ORIGINS configurado no `.env` (backend)
- [ ] DATABASE_URL configurado no `.env` (backend)
- [ ] VITE_API_URL configurada no `.env` (frontend)
- [ ] Frontend buildado com VITE_API_URL correto
- [ ] Migrações do banco de dados prontas
- [ ] Health check endpoint funcionando
- [ ] Security headers configurados
- [ ] Rate limiting configurado
- [ ] Timeout do Gunicorn aumentado
- [ ] Todas as URLs hardcoded removidas

## 🔍 Verificações Pós-Deploy

1. **Health Check**: `curl https://app.habitusforecast.com.br/api/health`
2. **CORS**: Verificar console do navegador (sem erros CORS)
3. **Login**: Testar login e autenticação
4. **Upload**: Testar upload de planilha
5. **Relatórios**: Testar geração de relatórios PDF/Excel
6. **Dashboard**: Verificar se dados carregam corretamente

## 📝 Notas Importantes

1. **SECRET_KEY**: Deve ser única e segura em produção. Nunca commitar no Git.
2. **CORS_ORIGINS**: Deve incluir apenas domínios confiáveis (sem wildcards em produção)
3. **VITE_API_URL**: Deve ser configurada ANTES do build do frontend
4. **Migrações**: São executadas automaticamente no startup do container backend
5. **Build do Frontend**: Deve ser feito sempre que houver mudanças no código frontend

## 🐛 Troubleshooting

### Erro: "SECRET_KEY deve ser configurada em produção!"
- **Solução**: Adicionar `SECRET_KEY` no `.env` do backend

### Erro de CORS em produção
- **Solução**: Verificar se `CORS_ORIGINS` inclui o domínio correto

### Frontend não conecta à API
- **Solução**: Verificar se `VITE_API_URL` foi configurada antes do build

### Migrações não executam
- **Solução**: Executar manualmente: `docker-compose exec backend alembic upgrade head`

### Upload falha por timeout
- **Solução**: Verificar se `TIMEOUT` está configurado (padrão: 300s)

## 📚 Documentação Relacionada

- `docs/GUIA_COMPLETO_PRODUCAO.md` - Guia completo de produção
- `docs/GUIA_RAPIDO_SERVIDOR.md` - Guia rápido de deploy
- `backend/docs/MIGRATION_RELATORIOS.md` - Migração da tabela relatorios
- `env.production.example` - Exemplo de variáveis de ambiente

