# Script PowerShell de backup automático do PostgreSQL
# Configure no Task Scheduler do Windows

$ErrorActionPreference = "Stop"

# Carregar variáveis de ambiente
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $scriptDir "..\.env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Configurações
$backupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { Join-Path $scriptDir "..\backups" }
$retentionDays = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 }
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Criar diretório de backup
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Verificar DATABASE_URL
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL não configurado" -ForegroundColor Red
    exit 1
}

# Parse DATABASE_URL
$dbUrl = $env:DATABASE_URL -replace 'postgresql://', ''
$dbParts = $dbUrl -split '@'
$userPass = $dbParts[0] -split ':'
$dbUser = $userPass[0]
$dbPass = $userPass[1]
$hostDb = $dbParts[1] -split '/'
$hostPort = $hostDb[0] -split ':'
$dbHost = $hostPort[0]
$dbPort = if ($hostPort.Length -gt 1) { $hostPort[1] } else { "5432" }
$dbName = $hostDb[1]

# Nome do arquivo de backup
$backupFile = Join-Path $backupDir "habitus_forecast_$timestamp.sql.gz"

# Verificar se pg_dump está disponível
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Host "❌ pg_dump não encontrado. Instale PostgreSQL client tools." -ForegroundColor Red
    exit 1
}

# Fazer backup
Write-Host "🔄 Fazendo backup do banco de dados..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPass

try {
    & pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName | & gzip > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup criado: $backupFile" -ForegroundColor Green
        
        # Remover backups antigos
        Write-Host "🧹 Removendo backups antigos (mais de $retentionDays dias)..." -ForegroundColor Yellow
        $cutoffDate = (Get-Date).AddDays(-$retentionDays)
        Get-ChildItem -Path $backupDir -Filter "habitus_forecast_*.sql.gz" | 
            Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
            Remove-Item -Force
    } else {
        Write-Host "❌ Erro ao criar backup" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

