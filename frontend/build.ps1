# Script PowerShell para build do frontend para produção
# Execute: .\frontend\build.ps1

Set-Location $PSScriptRoot

Write-Host "🔄 Instalando dependências..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Construindo aplicação para produção..." -ForegroundColor Yellow
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído!" -ForegroundColor Green
    Write-Host "📁 Arquivos gerados em: ..\backend\src\static\" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro ao fazer build" -ForegroundColor Red
    exit 1
}

