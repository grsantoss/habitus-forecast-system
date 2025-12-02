# Guia de Migração para PostgreSQL

Este documento descreve como migrar o banco de dados de SQLite para PostgreSQL.

## Pré-requisitos

1. PostgreSQL instalado e rodando (local ou remoto)
2. Banco de dados criado no PostgreSQL
3. Variáveis de ambiente configuradas

## Passo a Passo

### 1. Configurar PostgreSQL

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE habitus_forecast;
CREATE USER habitus_user WITH PASSWORD 'sua_senha_aqui';
GRANT ALL PRIVILEGES ON DATABASE habitus_forecast TO habitus_user;
```

### 2. Configurar Variáveis de Ambiente

Atualize o arquivo `backend/.env`:

```env
# SQLite (desenvolvimento) - manter para migração
SQLITE_DATABASE_URL=sqlite:///database/app.db

# PostgreSQL (produção)
DATABASE_URL=postgresql://habitus_user:sua_senha_aqui@localhost:5432/habitus_forecast
```

### 3. Instalar Dependências

```bash
cd backend
pip install -r requirements.txt
```

### 4. Executar Migrações Alembic

Criar as tabelas no PostgreSQL:

```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### 5. Popular Dados Iniciais

```bash
python scripts/seed_db.py
```

### 6. Migrar Dados do SQLite (Opcional)

Se você já tem dados no SQLite que precisa migrar:

```bash
python scripts/migrate_sqlite_to_postgres.py
```

### 7. Verificar Migração

Teste a aplicação:

```bash
python src/main.py
```

Acesse `http://localhost:5000` e verifique se tudo está funcionando.

### 8. Atualizar para Produção

Quando tudo estiver funcionando, atualize o `.env` para usar apenas PostgreSQL:

```env
DATABASE_URL=postgresql://habitus_user:sua_senha_aqui@localhost:5432/habitus_forecast
FLASK_ENV=production
FLASK_DEBUG=False
```

## Comandos Úteis do Alembic

```bash
# Criar nova migração
alembic revision --autogenerate -m "Descrição da migração"

# Aplicar migrações
alembic upgrade head

# Reverter última migração
alembic downgrade -1

# Ver histórico de migrações
alembic history

# Ver versão atual
alembic current
```

## Troubleshooting

### Erro de conexão com PostgreSQL

- Verifique se o PostgreSQL está rodando
- Verifique usuário e senha no `.env`
- Verifique se o banco de dados existe
- Verifique firewall/porta (5432)

### Erro ao criar tabelas

- Execute `alembic upgrade head` primeiro
- Verifique se todas as dependências estão instaladas

### Dados não migrados

- Verifique logs do script de migração
- Execute o script novamente (ele evita duplicatas)

