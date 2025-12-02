# Script PowerShell para iniciar ambiente de desenvolvimento com Docker
# Execute: .\scripts\docker-dev.ps1

Write-Host "🚀 Iniciando ambiente de desenvolvimento..." -ForegroundColor Cyan

# Criar arquivo .env se não existir
if (-not (Test-Path .env)) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    @"
# Docker Compose Environment
POSTGRES_DB=habitus_forecast
POSTGRES_USER=habitus
POSTGRES_PASSWORD=habitus123
POSTGRES_PORT=5432

# Backend
SECRET_KEY=dev-secret-key-change-in-production
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
WORKERS=2
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://localhost:5173

# Frontend
FRONTEND_PORT=5173
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ Arquivo .env criado. Configure as variáveis se necessário." -ForegroundColor Green
}

# Build e iniciar serviços
Write-Host "🐳 Iniciando containers..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host "⏳ Aguardando serviços iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Executar migrações
Write-Host "🔄 Executando migrações..." -ForegroundColor Yellow
docker-compose exec backend alembic upgrade head

# Popular dados iniciais
Write-Host "🌱 Populando dados iniciais..." -ForegroundColor Yellow
docker-compose exec backend python scripts/seed_db.py

Write-Host ""
Write-Host "✅ Ambiente de desenvolvimento iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "Serviços disponíveis:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:5000"
Write-Host "  - Frontend Dev: http://localhost:5173 (se habilitado)"
Write-Host "  - PostgreSQL: localhost:5432"
Write-Host ""
Write-Host "Comandos úteis:" -ForegroundColor Cyan
Write-Host "  - Ver logs: docker-compose logs -f"
Write-Host "  - Parar: docker-compose down"
Write-Host "  - Rebuild: docker-compose up -d --build"

