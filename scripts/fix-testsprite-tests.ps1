# Script de Correção Automática para Testes do TestSprite
# Versão simplificada que chama script Python
# Uso: .\scripts\fix-testsprite-tests.ps1

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Determinar caminho base do projeto
if ($PSScriptRoot) {
    $ProjectRoot = Split-Path $PSScriptRoot -Parent
} else {
    $ProjectRoot = $PWD.Path
}

$PythonScriptPath = Join-Path $ProjectRoot "scripts\fix_testsprite_tests.py"

if (-not (Test-Path $PythonScriptPath)) {
    Write-ColorOutput "❌ Erro: Script Python não encontrado em: $PythonScriptPath" "Red"
    exit 1
}

# Executar script Python
try {
    python $PythonScriptPath
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "`n❌ Erro ao executar correções" "Red"
        exit 1
    }
} catch {
    Write-ColorOutput "`n❌ Erro: $_" "Red"
    Write-ColorOutput "💡 Certifique-se de que Python está instalado e no PATH" "Yellow"
    exit 1
}
