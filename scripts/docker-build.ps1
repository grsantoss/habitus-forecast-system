# Script PowerShell para build completo da aplicação com Docker
# Execute: .\scripts\docker-build.ps1

Write-Host "🐳 Building Habitus Forecast com Docker..." -ForegroundColor Cyan

# Build do frontend primeiro
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
docker build -t habitus-frontend:builder --target builder -f Dockerfile .

# Criar diretório de output se não existir
$outputDir = "..\backend\src\static"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Copiar arquivos buildados
docker run --rm -v "${PWD}\..\backend\src\static:/output" habitus-frontend:builder sh -c "cp -r dist/* /output/"
Set-Location ..

# Build do backend
Write-Host "📦 Building backend..." -ForegroundColor Yellow
Set-Location backend
docker build -t habitus-backend:latest -f Dockerfile .
Set-Location ..

Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar:" -ForegroundColor Cyan
Write-Host "  docker-compose up -d"

