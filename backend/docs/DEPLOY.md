# Guia de Deploy - Habitus Forecast

Este documento descreve como fazer deploy da aplicação em produção.

## Pré-requisitos

- Python 3.11+
- Node.js 18+ e pnpm
- PostgreSQL (ou SQLite para desenvolvimento)
- Gunicorn instalado

## Opções de Deploy

### Opção 1: Deploy Local com Gunicorn

#### 1. Preparar Ambiente

```bash
cd backend
pip install -r requirements.txt
```

#### 2. Configurar Variáveis de Ambiente

Crie `backend/.env`:

```env
SECRET_KEY=sua-chave-secreta-forte-aqui
DATABASE_URL=postgresql://usuario:senha@localhost:5432/habitus_forecast
FLASK_ENV=production
FLASK_DEBUG=False
CORS_ORIGINS=https://seu-dominio.com
PORT=5000
```

#### 3. Executar Migrações

```bash
alembic upgrade head
python scripts/seed_db.py
```

#### 4. Build do Frontend

```bash
cd ../frontend
pnpm install
pnpm run build
# Ou use o script:
# bash build.sh (Linux/Mac)
# .\build.ps1 (Windows)
```

#### 5. Iniciar com Gunicorn

```bash
cd backend
gunicorn --config gunicorn_config.py wsgi:application
```

Ou usando o Procfile:

```bash
foreman start
```

### Opção 2: Deploy em Plataformas PaaS

#### Railway

1. Conecte seu repositório GitHub ao Railway
2. Configure as variáveis de ambiente no dashboard
3. Railway detectará automaticamente o `Procfile`
4. Deploy automático a cada push

#### Render

1. Crie um novo Web Service
2. Conecte seu repositório
3. Configure:
   - Build Command: `cd frontend && pnpm install && pnpm run build`
   - Start Command: `gunicorn --config gunicorn_config.py wsgi:application`
4. Configure variáveis de ambiente

#### Heroku

1. Instale Heroku CLI
2. Login: `heroku login`
3. Crie app: `heroku create seu-app`
4. Configure variáveis: `heroku config:set SECRET_KEY=...`
5. Deploy: `git push heroku main`

### Opção 3: Deploy com Docker

Veja a documentação em `docs/DOCKER.md` (será criada na Fase 4).

### Opção 4: Deploy em VPS (Ubuntu/Debian)

#### 1. Instalar Dependências

```bash
sudo apt update
sudo apt install python3.11 python3-pip postgresql nginx
```

#### 2. Configurar PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE habitus_forecast;
CREATE USER habitus_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE habitus_forecast TO habitus_user;
\q
```

#### 3. Clonar e Configurar Aplicação

```bash
git clone seu-repositorio.git
cd habitus-forecast-system
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Configurar .env

```bash
cp .env.example .env
nano .env  # Edite com suas configurações
```

#### 5. Executar Migrações

```bash
alembic upgrade head
python scripts/seed_db.py
```

#### 6. Build Frontend

```bash
cd ../frontend
npm install -g pnpm
pnpm install
pnpm run build
```

#### 7. Configurar Systemd Service

Crie `/etc/systemd/system/habitus-forecast.service`:

```ini
[Unit]
Description=Habitus Forecast Gunicorn daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/path/to/habitus-forecast-system/backend
Environment="PATH=/path/to/habitus-forecast-system/backend/venv/bin"
ExecStart=/path/to/habitus-forecast-system/backend/venv/bin/gunicorn --config gunicorn_config.py wsgi:application

[Install]
WantedBy=multi-user.target
```

Ative e inicie:

```bash
sudo systemctl daemon-reload
sudo systemctl enable habitus-forecast
sudo systemctl start habitus-forecast
sudo systemctl status habitus-forecast
```

#### 8. Configurar Nginx

Crie `/etc/nginx/sites-available/habitus-forecast`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/habitus-forecast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. Configurar SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## Variáveis de Ambiente Importantes

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SECRET_KEY` | Chave secreta para sessões | Gerar com `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | URL do banco PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `FLASK_ENV` | Ambiente (development/production) | `production` |
| `FLASK_DEBUG` | Modo debug (False em produção) | `False` |
| `CORS_ORIGINS` | Origens permitidas (separadas por vírgula) | `https://seu-dominio.com` |
| `PORT` | Porta do servidor | `5000` |
| `WORKERS` | Número de workers Gunicorn | `4` |

## Comandos Úteis

### Verificar Status

```bash
# Ver logs do Gunicorn
sudo journalctl -u habitus-forecast -f

# Verificar se está rodando
curl http://localhost:5000/api/health

# Ver processos
ps aux | grep gunicorn
```

### Atualizar Aplicação

```bash
cd /path/to/habitus-forecast-system
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
cd ../frontend
pnpm install
pnpm run build
sudo systemctl restart habitus-forecast
```

### Backup do Banco de Dados

```bash
pg_dump -U habitus_user habitus_forecast > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Erro: "Address already in use"

A porta está em uso. Verifique:
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Erro: "Module not found"

Instale dependências:
```bash
pip install -r requirements.txt
```

### Erro: "Database connection failed"

Verifique:
- PostgreSQL está rodando: `sudo systemctl status postgresql`
- Credenciais no `.env` estão corretas
- Banco de dados existe

### Frontend não carrega

Verifique:
- Build foi executado: `ls backend/src/static/`
- Nginx está servindo arquivos estáticos corretamente
- CORS está configurado para o domínio correto

## Monitoramento

### Health Check

Endpoint disponível: `GET /api/health`

### Logs

- Gunicorn: `sudo journalctl -u habitus-forecast -f`
- Nginx: `sudo tail -f /var/log/nginx/error.log`
- Aplicação: Configurar logging no código

## Segurança

- ✅ Use HTTPS em produção
- ✅ Configure SECRET_KEY forte
- ✅ Desabilite DEBUG em produção
- ✅ Configure CORS apenas para domínios permitidos
- ✅ Use firewall (ufw)
- ✅ Mantenha dependências atualizadas
- ✅ Faça backups regulares do banco

