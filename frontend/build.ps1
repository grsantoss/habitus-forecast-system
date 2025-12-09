# Script PowerShell para build do frontend para produção
# Execute: .\frontend\build.ps1

$ErrorActionPreference = "Stop"  # Falhar em caso de erro

Set-Location $PSScriptRoot

# Detectar se estamos em produção
# Se NODE_ENV=production ou BUILD_ENV=production, validar VITE_API_URL
$buildEnv = if ($env:BUILD_ENV) { $env:BUILD_ENV } elseif ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }
$isProduction = ($buildEnv -eq "production" -or $buildEnv -eq "prod")

Write-Host "🔄 Instalando dependências..." -ForegroundColor Yellow
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

# Validar VITE_API_URL em produção
if ($isProduction) {
    if (-not $env:VITE_API_URL) {
        Write-Host "❌ ERRO: VITE_API_URL não configurada para produção!" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Configure a variável de ambiente VITE_API_URL antes do build:" -ForegroundColor Yellow
        Write-Host "   `$env:VITE_API_URL = 'https://app.habitusforecast.com.br/api'" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   Ou configure no arquivo .env do projeto raiz:" -ForegroundColor Yellow
        Write-Host "   VITE_API_URL=https://app.habitusforecast.com.br/api" -ForegroundColor Cyan
        exit 1
    }
    
    # Validar que não está usando localhost em produção
    if ($env:VITE_API_URL -match "localhost|127\.0\.0\.1") {
        Write-Host "❌ ERRO: VITE_API_URL não pode apontar para localhost em produção!" -ForegroundColor Red
        Write-Host "   Valor atual: $($env:VITE_API_URL)" -ForegroundColor Yellow
        Write-Host "   Configure uma URL de produção válida." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ VITE_API_URL validada: $($env:VITE_API_URL)" -ForegroundColor Green
} else {
    # Em desenvolvimento, apenas avisar se não estiver configurada
    if (-not $env:VITE_API_URL) {
        Write-Host "⚠️  VITE_API_URL não configurada!" -ForegroundColor Yellow
        Write-Host "   Usando valor padrão: http://localhost:5000/api" -ForegroundColor Yellow
        Write-Host "   Para produção, configure VITE_API_URL antes do build" -ForegroundColor Yellow
    } else {
        Write-Host "ℹ️  VITE_API_URL configurada: $($env:VITE_API_URL)" -ForegroundColor Cyan
    }
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

