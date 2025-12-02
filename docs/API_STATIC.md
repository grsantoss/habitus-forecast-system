# Documentação Estática da API - Habitus Forecast

Esta é uma versão estática da documentação da API. Para documentação interativa, acesse o Swagger UI após instalar `flask-restx`.

## 📋 Índice

1. [Autenticação](#autenticação)
2. [Projetos](#projetos)
3. [Cenários](#cenários)
4. [Lançamentos](#lançamentos)
5. [Upload](#upload)
6. [Dashboard](#dashboard)
7. [Admin](#admin)
8. [Settings](#settings)

---

## Autenticação

### POST `/api/auth/login`

Autenticar usuário e obter token JWT.

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response 200:**
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

**Códigos de Erro:**
- `400` - Dados inválidos
- `401` - Credenciais inválidas
- `403` - Usuário bloqueado ou pendente

---

### POST `/api/auth/register`

Registrar novo usuário.

**Request Body:**
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

**Response 201:**
```json
{
  "id": 2,
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "role": "usuario",
  "status": "pending"
}
```

---

### GET `/api/auth/me`

Obter dados do usuário atual.

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "usuario@exemplo.com",
  "role": "usuario",
  "status": "active"
}
```

---

### POST `/api/auth/logout`

Fazer logout.

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## Projetos

### GET `/api/projetos`

Listar todos os projetos do usuário.

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
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

---

### POST `/api/projetos`

Criar novo projeto.

**Request Body:**
```json
{
  "nome_cliente": "Cliente XYZ",
  "data_base_estudo": "2025-01-01",
  "saldo_inicial_caixa": 100000.00,
  "ponto_equilibrio": 50000.00
}
```

**Response 201:**
```json
{
  "id": 2,
  "usuario_id": 1,
  "nome_cliente": "Cliente XYZ",
  "data_base_estudo": "2025-01-01",
  "saldo_inicial_caixa": 100000.00,
  "created_at": "2025-01-15T11:00:00"
}
```

---

### GET `/api/projetos/<id>`

Obter projeto específico.

**Response 200:** (mesmo formato do POST)

---

### PUT `/api/projetos/<id>`

Atualizar projeto.

**Request Body:** (campos opcionais)
```json
{
  "nome_cliente": "Cliente Atualizado",
  "saldo_inicial_caixa": 150000.00
}
```

---

### DELETE `/api/projetos/<id>`

Deletar projeto e todos os dados associados.

**Response 204:** (sem conteúdo)

---

## Cenários

### GET `/api/cenarios`

Listar todos os cenários do usuário.

**Response 200:**
```json
[
  {
    "id": 1,
    "projeto_id": 1,
    "nome": "Realista",
    "descricao": "Cenário realista de vendas",
    "is_active": true,
    "created_at": "2025-01-15T10:00:00"
  }
]
```

---

### POST `/api/projetos/<projeto_id>/cenarios`

Criar novo cenário.

**Request Body:**
```json
{
  "nome": "Otimista",
  "descricao": "Cenário otimista",
  "is_active": true
}
```

**Nomes válidos:** Pessimista, Realista, Otimista, Agressivo

---

### PUT `/api/cenarios/<cenario_id>`

Atualizar cenário.

---

### DELETE `/api/cenarios/<cenario_id>`

Deletar cenário.

---

### GET `/api/cenarios/<cenario_id>/analise`

Obter análise detalhada do cenário.

**Response 200:**
```json
{
  "cenario_id": 1,
  "receita_total": 500000.00,
  "despesa_total": 400000.00,
  "saldo_final": 100000.00,
  "margem_lucro": 20.0
}
```

---

### GET `/api/cenarios/<cenario_id>/graficos`

Obter dados para gráficos.

**Query Parameters:**
- `periodo`: `mensal`, `trimestral`, `anual`, `todos` (padrão: `mensal`)

**Response 200:**
```json
{
  "meses": ["Jan/2025", "Fev/2025", ...],
  "valores": [10000, 15000, ...],
  "categorias": [...]
}
```

---

### POST `/api/cenarios/comparar`

Comparar múltiplos cenários.

**Request Body:**
```json
{
  "cenario_ids": [1, 2, 3]
}
```

---

## Lançamentos

### GET `/api/cenarios/<cenario_id>/lancamentos`

Listar lançamentos do cenário.

**Response 200:**
```json
[
  {
    "id": 1,
    "cenario_id": 1,
    "categoria_id": 1,
    "data_competencia": "2025-01-01",
    "valor": 10000.00,
    "tipo": "ENTRADA",
    "origem": "PROJETADO"
  }
]
```

---

### POST `/api/cenarios/<cenario_id>/lancamentos`

Criar novo lançamento.

**Request Body:**
```json
{
  "categoria_id": 1,
  "data_competencia": "2025-01-01",
  "valor": 10000.00,
  "tipo": "ENTRADA",
  "origem": "PROJETADO"
}
```

---

### PUT `/api/cenarios/<cenario_id>/lancamentos/<lancamento_id>`

Atualizar lançamento.

---

### DELETE `/api/cenarios/<cenario_id>/lancamentos/<lancamento_id>`

Deletar lançamento.

---

## Upload

### POST `/api/upload-planilha`

Upload e processamento de planilha Excel.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: Arquivo Excel (.xlsx ou .xls)

**Response 201:**
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

**Validações:**
- Extensão: .xlsx ou .xls
- Tamanho máximo: 16MB
- Formato: Habitus Forecast ou FDC-REAL

---

### POST `/api/validar-planilha`

Validar planilha sem processar.

**Response 200:**
```json
{
  "validacao": {
    "valido": true,
    "erros": [],
    "avisos": []
  },
  "filename": "planilha.xlsx"
}
```

---

### GET `/api/uploads/history`

Histórico de uploads do usuário.

**Response 200:**
```json
[
  {
    "id": 1,
    "nome": "planilha.xlsx",
    "data": "2025-01-15T10:00:00",
    "status": "processado",
    "lancamentos": 120
  }
]
```

---

## Dashboard

### GET `/api/dashboard/stats`

Estatísticas gerais.

**Query Parameters:**
- `usuario_id`: ID do usuário (apenas admin)

**Response 200:**
```json
{
  "total_projetos": 5,
  "total_cenarios": 15,
  "total_lancamentos": 500,
  "receita_total": 1000000.00,
  "despesa_total": 800000.00,
  "saldo_total": 200000.00
}
```

---

### GET `/api/dashboard/fluxo-caixa/<projeto_id>`

Dados de fluxo de caixa.

**Query Parameters:**
- `cenario`: Nome do cenário (padrão: "Realista")
- `usuario_id`: ID do usuário (apenas admin)

**Response 200:**
```json
{
  "meses": ["Jan/2025", "Fev/2025", ...],
  "valores": [10000, 15000, ...],
  "habitus_forecast": [10000, 12000, ...],
  "fdc_real": [9500, 11000, ...]
}
```

---

### POST `/api/dashboard/saldo-inicial`

Atualizar saldo inicial de caixa.

**Request Body:**
```json
{
  "saldo_inicial": 50000.00
}
```

**Validação:** Valor entre 0 e 1.000.000

---

## Admin

**⚠️ Todos os endpoints requerem role 'admin'**

### GET `/api/admin/usuarios`

Listar todos os usuários.

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `per_page`: Itens por página (padrão: 10)
- `search`: Busca por nome/email

---

### POST `/api/admin/usuarios`

Criar novo usuário.

---

### PUT `/api/admin/usuarios/<usuario_id>`

Atualizar usuário.

---

### DELETE `/api/admin/usuarios/<usuario_id>`

Deletar usuário.

---

### GET `/api/admin/logs`

Logs do sistema.

**Query Parameters:**
- `page`: Número da página
- `per_page`: Itens por página
- `acao`: Filtrar por ação
- `usuario_id`: Filtrar por usuário

---

## Settings

### GET `/api/settings/cenarios`

Obter configurações de cenários.

**Response 200:**
```json
{
  "pessimista": -10.0,
  "realista": 0.0,
  "otimista": 15.0,
  "agressivo": 30.0
}
```

---

### POST `/api/settings/cenarios`

Salvar configurações de cenários.

**Request Body:**
```json
{
  "pessimista": -10.0,
  "realista": 0.0,
  "otimista": 15.0,
  "agressivo": 30.0
}
```

---

### PUT `/api/settings/profile`

Atualizar perfil do usuário.

---

### PUT `/api/settings/password`

Alterar senha.

**Request Body:**
```json
{
  "senha_atual": "senha123",
  "nova_senha": "novaSenha456",
  "confirmar_senha": "novaSenha456"
}
```

---

## Health Check

### GET `/api/health`

Verificação de saúde da API (sem autenticação).

**Response 200:**
```json
{
  "status": "ok",
  "message": "Habitus Forecast API está funcionando"
}
```

