# Script PowerShell para iniciar a aplicação em produção com Gunicorn
# Execute: .\scripts\start_production.ps1

Set-Location $PSScriptRoot\..

Write-Host "🔍 Verificando ambiente..." -ForegroundColor Yellow

# Verificar se .env existe
if (-not (Test-Path .env)) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Copie .env.example para .env e configure as variáveis"
    exit 1
}

# Verificar se Gunicorn está instalado
python -c "import gunicorn" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Gunicorn não está instalado" -ForegroundColor Red
    Write-Host "   Execute: pip install -r requirements.txt"
    exit 1
}

# Verificar se migrações foram aplicadas
Write-Host "🔍 Verificando migrações..." -ForegroundColor Yellow
alembic current 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Aviso: Migrações podem não estar aplicadas" -ForegroundColor Yellow
    Write-Host "   Execute: alembic upgrade head"
}

# Verificar se frontend foi buildado
if (-not (Test-Path "src\static\index.html")) {
    Write-Host "⚠ Aviso: Frontend não foi buildado" -ForegroundColor Yellow
    Write-Host "   Execute: cd ..\frontend && pnpm run build"
}

Write-Host "🚀 Iniciando servidor Gunicorn..." -ForegroundColor Green
gunicorn --config gunicorn_config.py wsgi:application

