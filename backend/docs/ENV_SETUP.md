# Configuração de Variáveis de Ambiente

## Arquivo .env.example

O arquivo `backend/.env.example` deve conter as seguintes variáveis:

```env
# Configurações do Backend Habitus Forecast
# Copie este arquivo para .env e preencha com os valores reais

# Chave secreta para sessões e tokens JWT
# Gere uma chave forte em produção: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=habitus_secret_key_2025_super_secure_change_in_production

# URL do banco de dados
# SQLite (desenvolvimento): sqlite:///database/app.db
# PostgreSQL (produção): postgresql://user:password@host:5432/dbname
DATABASE_URL=sqlite:///database/app.db

# Ambiente de execução (development, production)
FLASK_ENV=development

# Modo debug (True para desenvolvimento, False para produção)
FLASK_DEBUG=True

# Origens permitidas para CORS (separadas por vírgula)
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://localhost:5173

# Porta do servidor
PORT=5000

# Tamanho máximo de upload (em bytes, padrão: 16MB)
MAX_CONTENT_LENGTH=16777216
```

## Para Produção com PostgreSQL

Atualize o `DATABASE_URL` no arquivo `.env`:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
```

Exemplo com Supabase:
```env
DATABASE_URL=postgresql://postgres.xxxxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

Exemplo com Railway:
```env
DATABASE_URL=postgresql://postgres:senha@containers-us-west-xxx.railway.app:5432/railway
```

## Variáveis Importantes

- **SECRET_KEY**: Deve ser uma string aleatória e segura em produção
- **DATABASE_URL**: Suporta SQLite (dev) e PostgreSQL (produção)
- **CORS_ORIGINS**: Lista de origens permitidas separadas por vírgula
- **FLASK_ENV**: Define o ambiente (development/production)
- **FLASK_DEBUG**: Desabilite em produção (False)

