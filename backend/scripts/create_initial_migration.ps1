# Script PowerShell para criar a migração inicial do banco de dados
# Execute: .\scripts\create_initial_migration.ps1

Set-Location $PSScriptRoot\..

Write-Host "🔄 Criando migração inicial..." -ForegroundColor Yellow

# Verificar se Alembic está instalado
python -c "import alembic" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Alembic não está instalado. Execute: pip install -r requirements.txt" -ForegroundColor Red
    exit 1
}

# Criar migração inicial
alembic revision --autogenerate -m "Initial migration"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migração inicial criada!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Revise o arquivo de migração em migrations/versions/"
    Write-Host "2. Execute: alembic upgrade head"
    Write-Host "3. Execute: python scripts/seed_db.py"
} else {
    Write-Host "❌ Erro ao criar migração" -ForegroundColor Red
    exit 1
}

