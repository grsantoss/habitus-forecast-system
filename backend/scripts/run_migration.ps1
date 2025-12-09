# Script para executar migrações do banco de dados com tratamento de erros robusto
# Uso: .\backend\scripts\run_migration.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔄 Verificando configuração do Alembic..." -ForegroundColor Cyan

# Verificar se alembic.ini existe
$alembicIni = if ($env:ALEMBIC_INI) { $env:ALEMBIC_INI } else { "migrations\alembic.ini" }
if (-not (Test-Path $alembicIni)) {
    Write-Host "❌ ERRO: Arquivo alembic.ini não encontrado em: $alembicIni" -ForegroundColor Red
    exit 1
}

# Verificar se DATABASE_URL está configurada
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  AVISO: DATABASE_URL não configurada. Usando SQLite padrão." -ForegroundColor Yellow
}

Write-Host "🔄 Executando migrations..." -ForegroundColor Cyan
Write-Host "   Arquivo de configuração: $alembicIni" -ForegroundColor Gray

# Executar migrations com retry em caso de falha temporária
$maxRetries = 3
$retryDelay = 5
$retryCount = 0

# Navegar para o diretório backend
Set-Location $PSScriptRoot\..

while ($retryCount -lt $maxRetries) {
    try {
        python -m alembic -c $alembicIni upgrade head
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrations aplicadas com sucesso!" -ForegroundColor Green
            exit 0
        } else {
            throw "Alembic retornou código de erro: $LASTEXITCODE"
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "⚠️  Tentativa $retryCount/$maxRetries falhou. Tentando novamente em ${retryDelay}s..." -ForegroundColor Yellow
            Start-Sleep -Seconds $retryDelay
        } else {
            Write-Host "❌ ERRO: Falha ao executar migrations após $maxRetries tentativas!" -ForegroundColor Red
            Write-Host ""
            Write-Host "   Possíveis causas:" -ForegroundColor Yellow
            Write-Host "   - Banco de dados não está acessível" -ForegroundColor Yellow
            Write-Host "   - Credenciais de banco de dados incorretas" -ForegroundColor Yellow
            Write-Host "   - Migrations com erros de sintaxe" -ForegroundColor Yellow
            Write-Host "   - Conflitos de versão do banco de dados" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   Verifique os logs acima para mais detalhes." -ForegroundColor Yellow
            exit 1
        }
    }
}

