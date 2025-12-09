# Script PowerShell de validação pré-deploy
# Execute: .\scripts\validate-pre-deploy.ps1
# Valida todas as condições críticas antes do deploy em produção

$ErrorActionPreference = "Stop"

$errors = 0
$warnings = 0

Write-Host "🔍 Validação Pré-Deploy - Habitus Forecast" -ForegroundColor Cyan
Write-Host "=========================================="
Write-Host ""

# Função para erro
function Write-Error-Custom {
    param($message)
    Write-Host "❌ ERRO: $message" -ForegroundColor Red
    $script:errors++
}

# Função para aviso
function Write-Warning-Custom {
    param($message)
    Write-Host "⚠️  AVISO: $message" -ForegroundColor Yellow
    $script:warnings++
}

# Função para sucesso
function Write-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# 1. Verificar se está no diretório correto
Write-Host "1. Verificando estrutura do projeto..." -ForegroundColor Cyan
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error-Custom "docker-compose.yml não encontrado. Execute do diretório raiz do projeto."
    exit 1
}
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Error-Custom "Estrutura de diretórios inválida. Backend ou frontend não encontrados."
    exit 1
}
Write-Success "Estrutura do projeto OK"
Write-Host ""

# 2. Verificar arquivo .env
Write-Host "2. Verificando variáveis de ambiente..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Error-Custom "Arquivo .env não encontrado!"
    Write-Host "   Crie o arquivo .env baseado em env.production.example"
    exit 1
}
Write-Success "Arquivo .env encontrado"

# Carregar variáveis de ambiente
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

# Validar variáveis obrigatórias
$requiredVars = @("SECRET_KEY", "DATABASE_URL", "POSTGRES_PASSWORD")
foreach ($var in $requiredVars) {
    if (-not $env:$var) {
        Write-Error-Custom "$var não configurada no .env"
    } else {
        Write-Success "$var configurada"
    }
}

# Validar SECRET_KEY
if ($env:SECRET_KEY -and $env:SECRET_KEY.Length -lt 32) {
    Write-Error-Custom "SECRET_KEY deve ter pelo menos 32 caracteres (atual: $($env:SECRET_KEY.Length))"
}

# Validar DATABASE_URL
if ($env:DATABASE_URL -and -not $env:DATABASE_URL.StartsWith("postgresql://")) {
    Write-Error-Custom "DATABASE_URL deve começar com postgresql://"
}

# Validar CORS_ORIGINS em produção
if ($env:FLASK_ENV -eq "production" -and $env:CORS_ORIGINS) {
    if ($env:CORS_ORIGINS -match "localhost|127\.0\.0\.1") {
        Write-Warning-Custom "CORS_ORIGINS contém localhost em produção. Isso pode ser um risco de segurança."
    }
}

# Validar VITE_API_URL
if (-not $env:VITE_API_URL) {
    Write-Error-Custom "VITE_API_URL não configurada. Necessária para build do frontend."
} elseif ($env:VITE_API_URL -match "localhost|127\.0\.0\.1") {
    Write-Warning-Custom "VITE_API_URL aponta para localhost. Certifique-se de que é correto para produção."
}

Write-Host ""

# 3. Verificar dependências do backend
Write-Host "3. Verificando dependências do backend..." -ForegroundColor Cyan
if (-not (Test-Path "backend\requirements.txt")) {
    Write-Error-Custom "backend\requirements.txt não encontrado"
} else {
    Write-Success "requirements.txt encontrado"
}
Write-Host ""

# 4. Verificar dependências do frontend
Write-Host "4. Verificando dependências do frontend..." -ForegroundColor Cyan
if (-not (Test-Path "frontend\package.json")) {
    Write-Error-Custom "frontend\package.json não encontrado"
} else {
    Write-Success "package.json encontrado"
}
Write-Host ""

# 5. Verificar migrations
Write-Host "5. Verificando migrations..." -ForegroundColor Cyan
if (-not (Test-Path "backend\migrations\alembic.ini")) {
    Write-Error-Custom "backend\migrations\alembic.ini não encontrado"
} else {
    Write-Success "alembic.ini encontrado"
}

$migrationFiles = Get-ChildItem "backend\migrations\versions\*.py" -ErrorAction SilentlyContinue
if (-not $migrationFiles) {
    Write-Warning-Custom "Nenhuma migration encontrada em backend\migrations\versions\"
} else {
    Write-Success "$($migrationFiles.Count) migration(s) encontrada(s)"
}
Write-Host ""

# 6. Verificar configuração do Nginx
Write-Host "6. Verificando configuração do Nginx..." -ForegroundColor Cyan
if (-not (Test-Path "nginx\habitus-forecast.conf")) {
    Write-Warning-Custom "nginx\habitus-forecast.conf não encontrado"
} else {
    $nginxContent = Get-Content "nginx\habitus-forecast.conf" -Raw
    if ($nginxContent -match "/path/to/habitus-forecast-system") {
        Write-Error-Custom "Caminho placeholder no nginx\habitus-forecast.conf não foi ajustado"
    } else {
        Write-Success "Configuração do Nginx OK"
    }
}
Write-Host ""

# 7. Verificar scripts de build
Write-Host "7. Verificando scripts de build..." -ForegroundColor Cyan
if (-not (Test-Path "frontend\build.sh") -or -not (Test-Path "frontend\build.ps1")) {
    Write-Warning-Custom "Scripts de build do frontend não encontrados"
} else {
    Write-Success "Scripts de build encontrados"
}
Write-Host ""

# 8. Verificar Dockerfiles
Write-Host "8. Verificando Dockerfiles..." -ForegroundColor Cyan
if (-not (Test-Path "backend\Dockerfile")) {
    Write-Error-Custom "backend\Dockerfile não encontrado"
} else {
    Write-Success "backend\Dockerfile encontrado"
}

if (-not (Test-Path "frontend\Dockerfile")) {
    Write-Warning-Custom "frontend\Dockerfile não encontrado"
} else {
    Write-Success "frontend\Dockerfile encontrado"
}
Write-Host ""

# 9. Verificar se há SECRET_KEY hardcoded no código
Write-Host "9. Verificando segurança do código..." -ForegroundColor Cyan
$secretKeyMatches = Select-String -Path "backend\src\**\*.py" -Pattern "SECRET_KEY.*=.*['`"].*habitus" | Where-Object { $_.Line -notmatch "os\.getenv" -and $_.Line -notmatch "#" }
if ($secretKeyMatches) {
    Write-Error-Custom "SECRET_KEY hardcoded encontrada no código!"
    $secretKeyMatches | ForEach-Object { Write-Host "   $($_.Filename):$($_.LineNumber): $($_.Line)" }
} else {
    Write-Success "Nenhuma SECRET_KEY hardcoded encontrada"
}

$debugMatches = Select-String -Path "backend\src\**\*.py" -Pattern "debug=True"
if ($debugMatches) {
    Write-Warning-Custom "debug=True encontrado no código. Verifique se não será usado em produção."
} else {
    Write-Success "Nenhum debug=True hardcoded encontrado"
}
Write-Host ""

# 10. Verificar se há console.log no frontend (apenas aviso)
Write-Host "10. Verificando logs de debug no frontend..." -ForegroundColor Cyan
$consoleLogMatches = Select-String -Path "frontend\src\**\*.jsx", "frontend\src\**\*.js" -Pattern "console\.log" -ErrorAction SilentlyContinue
if ($consoleLogMatches) {
    Write-Warning-Custom "$($consoleLogMatches.Count) console.log encontrado(s) no frontend. Considere remover para produção."
} else {
    Write-Success "Nenhum console.log encontrado no frontend"
}
Write-Host ""

# Resumo
Write-Host "=========================================="
Write-Host "📊 Resumo da Validação" -ForegroundColor Cyan
Write-Host "=========================================="
Write-Host "Erros encontrados: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "Avisos encontrados: $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($errors -gt 0) {
    Write-Host "❌ Validação FALHOU!" -ForegroundColor Red
    Write-Host "Corrija os erros acima antes de fazer deploy."
    exit 1
} elseif ($warnings -gt 0) {
    Write-Host "⚠️  Validação concluída com avisos." -ForegroundColor Yellow
    Write-Host "Revise os avisos acima antes de fazer deploy."
    exit 0
} else {
    Write-Host "✅ Validação concluída com sucesso!" -ForegroundColor Green
    Write-Host "O projeto está pronto para deploy."
    exit 0
}

