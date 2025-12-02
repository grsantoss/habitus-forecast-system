# O que falta para iniciar testes - Habitus Forecast

## ✅ O que já está implementado

### 1. HTTPS/SSL ✅
- Configurações Nginx criadas
- Scripts de setup automático
- Documentação completa
- Suporte Docker/Traefik

### 2. Documentação da API ✅
- Swagger/OpenAPI configurado
- Schemas criados
- Documentação estática completa
- Collection Postman

## 🔴 O que falta para iniciar testes

### 1. Instalar Dependências

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
pnpm install
```

### 2. Configurar Banco de Dados

**Opção A: SQLite (Desenvolvimento)**
```bash
cd backend
python src/main.py  # Cria banco automaticamente
```

**Opção B: PostgreSQL (Produção)**
```bash
# Criar banco de dados
createdb habitus_forecast

# Configurar DATABASE_URL no .env
DATABASE_URL=postgresql://user:password@localhost:5432/habitus_forecast

# Executar migrations (se usando Alembic)
alembic upgrade head
```

### 3. Configurar Variáveis de Ambiente

**Backend (.env):**
```env
SECRET_KEY=sua-chave-secreta-aqui
DATABASE_URL=sqlite:///database/app.db
FLASK_ENV=development
FLASK_DEBUG=True
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://localhost:5173
PORT=5000
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Verificar Flask-RESTX

A documentação Swagger requer `flask-restx`. Verifique se está instalado:

```bash
pip list | grep flask-restx
```

Se não estiver:
```bash
pip install flask-restx==1.3.0
```

### 5. Testar Aplicação

**Backend:**
```bash
cd backend
python src/main.py
```

Acesse:
- API: `http://localhost:5000/api/health`
- Swagger: `http://localhost:5000/api/docs/swagger`

**Frontend:**
```bash
cd frontend
pnpm run dev
```

Acesse: `http://localhost:5173`

### 6. Criar Usuário Admin (se necessário)

Se o banco estiver vazio, o sistema cria automaticamente:
- Email: `admin@habitus.com`
- Senha: `admin123`

Ou crie manualmente via API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin",
    "email": "admin@habitus.com",
    "password": "admin123",
    "role": "admin"
  }'
```

## 📋 Checklist de Testes

### Testes Básicos

- [ ] Backend inicia sem erros
- [ ] Frontend compila sem erros
- [ ] Health check responde: `/api/health`
- [ ] Swagger UI acessível: `/api/docs/swagger`
- [ ] Login funciona: `/api/auth/login`
- [ ] CORS configurado corretamente

### Testes de Funcionalidade

- [ ] Criar projeto
- [ ] Criar cenário
- [ ] Criar lançamento
- [ ] Upload de planilha
- [ ] Dashboard carrega dados
- [ ] Relatórios geram corretamente

### Testes de Segurança

- [ ] Autenticação JWT funciona
- [ ] Endpoints protegidos requerem token
- [ ] Admin endpoints bloqueiam usuários comuns
- [ ] Upload valida extensão e tamanho

### Testes de Integração

- [ ] Frontend comunica com backend
- [ ] Upload processa planilha corretamente
- [ ] Gráficos carregam dados
- [ ] Relatórios PDF/Excel geram

## 🧪 Ferramentas de Teste Recomendadas

### 1. Postman
- Importar collection de `docs/API_POSTMAN.md`
- Testar endpoints manualmente
- Criar testes automatizados

### 2. Swagger UI
- Acessar `http://localhost:5000/api/docs/swagger`
- Testar endpoints diretamente na interface
- Ver schemas e validações

### 3. pytest (Backend)
```bash
pip install pytest pytest-flask pytest-cov
```

Criar arquivo `backend/tests/test_auth.py`:
```python
import pytest
from src.main import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
```

### 4. Jest/Vitest (Frontend)
```bash
cd frontend
pnpm add -D vitest @testing-library/react
```

## 🐛 Problemas Comuns

### Erro: "ModuleNotFoundError: No module named 'flask_restx'"
**Solução:** `pip install flask-restx`

### Erro: "Database locked" (SQLite)
**Solução:** Verifique se não há outra instância rodando

### Erro: CORS bloqueado
**Solução:** Verifique `CORS_ORIGINS` no `.env` do backend

### Swagger não aparece
**Solução:** 
1. Verifique se `flask-restx` está instalado
2. Verifique logs do backend
3. Acesse `/api/docs/swagger` (não `/api/docs`)

## 📝 Próximos Passos Após Testes

1. **Criar testes automatizados**
   - Unit tests para modelos
   - Integration tests para endpoints
   - E2E tests para fluxos principais

2. **Configurar CI/CD**
   - Executar testes automaticamente
   - Validar código antes de merge

3. **Documentar casos de teste**
   - Cenários de uso
   - Casos limite
   - Tratamento de erros

## 🚀 Comandos Rápidos

```bash
# Setup completo
cd backend && pip install -r requirements.txt
cd ../frontend && pnpm install

# Iniciar backend
cd backend && python src/main.py

# Iniciar frontend (outro terminal)
cd frontend && pnpm run dev

# Testar API
curl http://localhost:5000/api/health

# Acessar Swagger
# Abra: http://localhost:5000/api/docs/swagger
```

