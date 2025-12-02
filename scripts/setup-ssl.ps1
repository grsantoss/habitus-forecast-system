# Script PowerShell para configurar HTTPS/SSL (Windows com WSL ou servidor Linux remoto)
# Execute: .\scripts\setup-ssl.ps1

Write-Host "🔒 Configurando HTTPS/SSL para Habitus Forecast" -ForegroundColor Cyan
Write-Host ""

# Solicitar informações
$domain = Read-Host "Digite o domínio (ex: exemplo.com)"
$email = Read-Host "Digite o email para notificações do Let's Encrypt"
$serverHost = Read-Host "Digite o IP ou hostname do servidor Linux"
$serverUser = Read-Host "Digite o usuário SSH do servidor"

if ([string]::IsNullOrWhiteSpace($domain) -or 
    [string]::IsNullOrWhiteSpace($email) -or 
    [string]::IsNullOrWhiteSpace($serverHost) -or 
    [string]::IsNullOrWhiteSpace($serverUser)) {
    Write-Host "❌ Todos os campos são obrigatórios" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   Domínio: $domain"
Write-Host "   Email: $email"
Write-Host "   Servidor: $serverUser@$serverHost"
Write-Host ""
$confirm = Read-Host "Continuar? (s/n)"

if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "❌ Cancelado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Instruções para configuração manual:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conecte-se ao servidor:" -ForegroundColor Cyan
Write-Host "   ssh $serverUser@$serverHost"
Write-Host ""
Write-Host "2. Execute o script de setup:" -ForegroundColor Cyan
Write-Host "   sudo bash scripts/setup-ssl.sh"
Write-Host ""
Write-Host "3. Ou configure manualmente seguindo:" -ForegroundColor Cyan
Write-Host "   docs/HTTPS_SETUP.md"
Write-Host ""

