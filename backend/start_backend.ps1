# Script para iniciar o backend Flask
Write-Host "Iniciando backend Flask..." -ForegroundColor Green

# Navegar para o diretório do backend
Set-Location $PSScriptRoot

# Ativar ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Verificar se as dependências estão instaladas
Write-Host "Verificando dependências..." -ForegroundColor Yellow
python -c "import flask" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Instalando dependências..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Iniciar servidor Flask
Write-Host "Iniciando servidor Flask na porta 5000..." -ForegroundColor Green
Write-Host "Servidor rodando em: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Yellow
Write-Host ""

python src/main.py

