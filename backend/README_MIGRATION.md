# Fase 2: Migração para PostgreSQL - Concluída ✅

## O que foi implementado

### 1. Dependências Adicionadas
- ✅ `psycopg2-binary==2.9.9` - Driver PostgreSQL
- ✅ `alembic==1.13.1` - Sistema de migrações

### 2. Alembic Configurado
- ✅ Estrutura de diretórios criada (`migrations/`)
- ✅ `alembic.ini` configurado
- ✅ `env.py` configurado para usar variáveis de ambiente
- ✅ Suporte para SQLite e PostgreSQL

### 3. Scripts Criados
- ✅ `scripts/seed_db.py` - Popular banco com dados iniciais
- ✅ `scripts/migrate_sqlite_to_postgres.py` - Migrar dados do SQLite
- ✅ `scripts/create_initial_migration.ps1` - Criar migração inicial (PowerShell)
- ✅ `scripts/create_initial_migration.sh` - Criar migração inicial (Bash)

### 4. Código Atualizado
- ✅ `main.py` removido `db.create_all()` automático
- ✅ Migrações agora são gerenciadas via Alembic
- ✅ Dados iniciais via script separado

### 5. Documentação
- ✅ `docs/MIGRATION.md` - Guia completo de migração
- ✅ `docs/ENV_SETUP.md` - Configuração de variáveis de ambiente

## Próximos Passos

### Para usar PostgreSQL localmente:

1. **Instalar PostgreSQL** (se ainda não tiver)
   - Windows: https://www.postgresql.org/download/windows/
   - Ou use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=senha postgres`

2. **Criar banco de dados**
   ```sql
   CREATE DATABASE habitus_forecast;
   ```

3. **Configurar .env**
   ```env
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/habitus_forecast
   ```

4. **Instalar dependências**
   ```bash
   pip install -r requirements.txt
   ```

5. **Criar migração inicial**
   ```bash
   # Windows PowerShell
   .\scripts\create_initial_migration.ps1
   
   # Ou manualmente
   alembic revision --autogenerate -m "Initial migration"
   ```

6. **Aplicar migrações**
   ```bash
   alembic upgrade head
   ```

7. **Popular dados iniciais**
   ```bash
   python scripts/seed_db.py
   ```

8. **Testar aplicação**
   ```bash
   python src/main.py
   ```

### Para migrar dados existentes do SQLite:

1. Configure ambos os bancos no `.env`:
   ```env
   SQLITE_DATABASE_URL=sqlite:///database/app.db
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/habitus_forecast
   ```

2. Execute o script de migração:
   ```bash
   python scripts/migrate_sqlite_to_postgres.py
   ```

## Comandos Úteis

```bash
# Ver status das migrações
alembic current

# Ver histórico
alembic history

# Criar nova migração
alembic revision --autogenerate -m "Descrição"

# Aplicar migrações
alembic upgrade head

# Reverter migração
alembic downgrade -1
```

## Notas Importantes

- ⚠️ O `db.create_all()` foi removido do `main.py`
- ✅ Use sempre Alembic para criar/modificar tabelas
- ✅ Execute `seed_db.py` após criar o banco pela primeira vez
- ✅ Faça backup antes de migrar dados importantes

