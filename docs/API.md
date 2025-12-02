# Documentação da API - Habitus Forecast

API REST para o sistema Habitus Forecast - Gestão Financeira e Projeção de Fluxo de Caixa.

## 📚 Acesso à Documentação Interativa

Após instalar `flask-restx`, acesse:
- **Swagger UI**: `http://localhost:5000/api/docs/swagger`
- **ReDoc**: `http://localhost:5000/api/docs/` (se configurado)

## 🔐 Autenticação

A API usa autenticação JWT (JSON Web Tokens).

### Como Autenticar

1. Faça login em `/api/auth/login` com email e senha
2. Receba o token JWT na resposta
3. Inclua o token em todas as requisições:
   ```
   Authorization: Bearer {seu_token_aqui}
   ```

### Token Expiração

- Tokens expiram em **24 horas**
- Após expiração, faça login novamente

## 📍 Base URL

- **Desenvolvimento**: `http://localhost:5000/api`
- **Produção**: `https://seu-dominio.com/api`

## 🛣️ Endpoints Principais

### Autenticação (`/api/auth`)

#### POST `/api/auth/login`
Autenticar usuário e obter token JWT.

**Request:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "nome": "João Silva",
    "email": "usuario@exemplo.com",
    "role": "usuario",
    "status": "active"
  }
}
```

#### POST `/api/auth/register`
Registrar novo usuário.

**Request:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "role": "usuario",
  "telefone": "(11) 99999-9999",
  "empresa": "Empresa XYZ",
  "cnpj": "12.345.678/0001-90"
}
```

#### GET `/api/auth/me`
Obter dados do usuário atual (requer autenticação).

#### POST `/api/auth/logout`
Fazer logout (requer autenticação).

---

### Projetos (`/api/projetos`)

#### GET `/api/projetos`
Listar todos os projetos do usuário (requer autenticação).

**Response:**
```json
[
  {
    "id": 1,
    "usuario_id": 1,
    "nome_cliente": "Cliente ABC",
    "data_base_estudo": "2025-01-01",
    "saldo_inicial_caixa": 50000.00,
    "ponto_equilibrio": 30000.00,
    "created_at": "2025-01-15T10:00:00"
  }
]
```

#### POST `/api/projetos`
Criar novo projeto (requer autenticação).

**Request:**
```json
{
  "nome_cliente": "Cliente XYZ",
  "data_base_estudo": "2025-01-01",
  "saldo_inicial_caixa": 100000.00,
  "ponto_equilibrio": 50000.00
}
```

#### GET `/api/projetos/<id>`
Obter projeto específico (requer autenticação).

#### PUT `/api/projetos/<id>`
Atualizar projeto (requer autenticação).

#### DELETE `/api/projetos/<id>`
Deletar projeto (requer autenticação).

---

### Cenários (`/api/cenarios`)

#### GET `/api/cenarios`
Listar todos os cenários do usuário (requer autenticação).

#### POST `/api/projetos/<projeto_id>/cenarios`
Criar novo cenário (requer autenticação).

**Request:**
```json
{
  "nome": "Realista",
  "descricao": "Cenário realista de vendas",
  "is_active": true
}
```

#### PUT `/api/cenarios/<cenario_id>`
Atualizar cenário (requer autenticação).

#### DELETE `/api/cenarios/<cenario_id>`
Deletar cenário (requer autenticação).

#### GET `/api/cenarios/<cenario_id>/analise`
Obter análise do cenário (requer autenticação).

#### GET `/api/cenarios/<cenario_id>/graficos`
Obter dados para gráficos (requer autenticação).

**Query Parameters:**
- `periodo`: `mensal`, `trimestral`, `anual`, `todos` (padrão: `mensal`)

#### POST `/api/cenarios/comparar`
Comparar múltiplos cenários (requer autenticação).

**Request:**
```json
{
  "cenario_ids": [1, 2, 3]
}
```

---

### Lançamentos (`/api/cenarios/<cenario_id>/lancamentos`)

#### GET `/api/cenarios/<cenario_id>/lancamentos`
Listar lançamentos do cenário (requer autenticação).

#### POST `/api/cenarios/<cenario_id>/lancamentos`
Criar novo lançamento (requer autenticação).

**Request:**
```json
{
  "categoria_id": 1,
  "data_competencia": "2025-01-01",
  "valor": 10000.00,
  "tipo": "ENTRADA",
  "origem": "PROJETADO"
}
```

#### PUT `/api/cenarios/<cenario_id>/lancamentos/<lancamento_id>`
Atualizar lançamento (requer autenticação).

#### DELETE `/api/cenarios/<cenario_id>/lancamentos/<lancamento_id>`
Deletar lançamento (requer autenticação).

---

### Upload (`/api/upload-planilha`)

#### POST `/api/upload-planilha`
Upload e processamento de planilha Excel (requer autenticação).

**Request:** `multipart/form-data`
- `file`: Arquivo Excel (.xlsx ou .xls)

**Response (201):**
```json
{
  "message": "Planilha processada com sucesso",
  "projeto_id": 1,
  "lancamentos_criados": 120,
  "parametros": {
    "data_base": "2025-01-01",
    "meses": 12
  }
}
```

#### POST `/api/validar-planilha`
Validar planilha sem processar (requer autenticação).

#### GET `/api/uploads/history`
Histórico de uploads do usuário (requer autenticação).

#### GET `/api/uploads/<upload_id>/download`
Download de arquivo processado (requer autenticação).

#### DELETE `/api/uploads/<upload_id>`
Deletar upload e dados associados (requer autenticação).

#### PUT `/api/uploads/<upload_id>/rename`
Renomear upload (requer autenticação).

**Request:**
```json
{
  "nome": "Novo Nome.xlsx"
}
```

---

### Dashboard (`/api/dashboard`)

#### GET `/api/dashboard/stats`
Estatísticas gerais do dashboard (requer autenticação).

**Query Parameters:**
- `usuario_id`: ID do usuário (apenas admin)

#### GET `/api/dashboard/fluxo-caixa/<projeto_id>`
Dados de fluxo de caixa (requer autenticação).

**Query Parameters:**
- `cenario`: Nome do cenário (padrão: "Realista")
- `usuario_id`: ID do usuário (apenas admin)

#### GET `/api/dashboard/categorias/<projeto_id>`
Dados de categorias financeiras (requer autenticação).

#### GET `/api/dashboard/saldo-inicial`
Obter saldo inicial de caixa (requer autenticação).

#### POST `/api/dashboard/saldo-inicial`
Atualizar saldo inicial de caixa (requer autenticação).

**Request:**
```json
{
  "saldo_inicial": 50000.00
}
```

**Validação:** Valor entre 0 e 1.000.000

#### POST `/api/dashboard/ponto-equilibrio`
Atualizar ponto de equilíbrio (requer autenticação).

---

### Admin (`/api/admin`)

**⚠️ Requer role 'admin'**

#### GET `/api/admin/usuarios`
Listar todos os usuários (requer admin).

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `per_page`: Itens por página (padrão: 10)
- `search`: Busca por nome/email

#### POST `/api/admin/usuarios`
Criar novo usuário (requer admin).

#### PUT `/api/admin/usuarios/<usuario_id>`
Atualizar usuário (requer admin).

#### DELETE `/api/admin/usuarios/<usuario_id>`
Deletar usuário (requer admin).

#### GET `/api/admin/logs`
Logs do sistema (requer admin).

**Query Parameters:**
- `page`: Número da página
- `per_page`: Itens por página
- `acao`: Filtrar por ação
- `usuario_id`: Filtrar por usuário

#### GET `/api/admin/estatisticas`
Estatísticas administrativas (requer admin).

#### GET `/api/admin/projetos`
Listar todos os projetos (requer admin).

---

### Settings (`/api/settings`)

#### GET `/api/settings/cenarios`
Obter configurações de cenários (requer autenticação).

**Response:**
```json
{
  "pessimista": -10.0,
  "realista": 0.0,
  "otimista": 15.0,
  "agressivo": 30.0
}
```

#### POST `/api/settings/cenarios`
Salvar configurações de cenários (requer autenticação).

**Request:**
```json
{
  "pessimista": -10.0,
  "realista": 0.0,
  "otimista": 15.0,
  "agressivo": 30.0
}
```

**Validações:**
- Pessimista: ≤ 0
- Realista: sempre 0
- Otimista: ≥ 0
- Agressivo: ≥ 0
- Todos entre -100 e 100

#### GET `/api/settings/profile`
Obter perfil do usuário (requer autenticação).

#### PUT `/api/settings/profile`
Atualizar perfil (requer autenticação).

#### PUT `/api/settings/password`
Alterar senha (requer autenticação).

**Request:**
```json
{
  "senha_atual": "senha123",
  "nova_senha": "novaSenha456",
  "confirmar_senha": "novaSenha456"
}
```

---

### Outros

#### GET `/api/health`
Health check da API (sem autenticação).

**Response:**
```json
{
  "status": "ok",
  "message": "Habitus Forecast API está funcionando"
}
```

#### GET `/api/categorias`
Listar categorias financeiras (requer autenticação).

---

## 📝 Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Acesso negado (sem permissão)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## 🔒 Permissões

### Usuário Comum
- Gerenciar próprios projetos
- Criar e editar próprios cenários
- Upload de planilhas
- Acessar dashboard próprio
- Configurar próprias settings

### Admin
- Todas as permissões de usuário comum
- Gerenciar todos os usuários
- Visualizar todos os projetos
- Acessar logs do sistema
- Estatísticas administrativas

## 📦 Formatos de Dados

### Datas
Formato ISO 8601: `YYYY-MM-DD`
Exemplo: `2025-01-15`

### Valores Monetários
Números decimais (float)
Exemplo: `50000.00`

### Upload de Arquivos
- Content-Type: `multipart/form-data`
- Campo: `file`
- Formatos aceitos: `.xlsx`, `.xls`
- Tamanho máximo: 16MB

## 🧪 Exemplos de Uso

### Exemplo Completo: Criar Projeto e Cenário

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@habitus.com", "password": "admin123"}'

# 2. Criar Projeto (usar token do passo 1)
curl -X POST http://localhost:5000/api/projetos \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_cliente": "Cliente XYZ",
    "data_base_estudo": "2025-01-01",
    "saldo_inicial_caixa": 100000.00
  }'

# 3. Criar Cenário
curl -X POST http://localhost:5000/api/projetos/1/cenarios \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Realista",
    "descricao": "Cenário realista",
    "is_active": true
  }'
```

### Exemplo: Upload de Planilha

```bash
curl -X POST http://localhost:5000/api/upload-planilha \
  -H "Authorization: Bearer {token}" \
  -F "file=@planilha.xlsx"
```

## 🔗 Links Úteis

- **Swagger UI**: `http://localhost:5000/api/docs/swagger`
- **Health Check**: `http://localhost:5000/api/health`
- **Repositório**: [GitHub](https://github.com/seu-usuario/habitus-forecast-system)

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Consulte a documentação Swagger interativa
- Verifique os logs do sistema

