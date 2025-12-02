# Script para iniciar backend para testes do TestSprite
# Execute: .\scripts\start-backend-for-tests.ps1

Write-Host "🚀 Iniciando backend para testes..." -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendPath

# Verificar se venv existe
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "📦 Ativando ambiente virtual..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "⚠️ Ambiente virtual não encontrado. Criando..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
}

# Verificar se banco existe
$dbPath = Join-Path $backendPath "database\app.db"
if (-not (Test-Path $dbPath)) {
    Write-Host "🗄️ Criando banco de dados..." -ForegroundColor Yellow
    python init_simple.py
}

# Iniciar servidor em background
Write-Host "🌐 Iniciando servidor Flask na porta 5000..." -ForegroundColor Green
Write-Host "   Acesse: http://localhost:5000/api/health" -ForegroundColor Gray
Write-Host "   Para parar: Ctrl+C" -ForegroundColor Gray
Write-Host ""

python src\main.py

