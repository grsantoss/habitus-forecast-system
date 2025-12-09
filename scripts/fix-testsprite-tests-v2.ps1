# Script de Correção Automática para Testes do TestSprite
# Versão simplificada e corrigida
# Uso: .\scripts\fix-testsprite-tests-v2.ps1

$ErrorActionPreference = "Stop"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "🔧 Iniciando correção automática dos testes do TestSprite..." "Cyan"

# Determinar caminho base do projeto
if ($PSScriptRoot) {
    $ProjectRoot = Split-Path $PSScriptRoot -Parent
} else {
    $ProjectRoot = $PWD.Path
}

$TestsPath = Join-Path $ProjectRoot "testsprite_tests"

if (-not (Test-Path $TestsPath)) {
    Write-ColorOutput "❌ Erro: Pasta testsprite_tests não encontrada em: $TestsPath" "Red"
    Write-ColorOutput "💡 Certifique-se de executar o script a partir da raiz do projeto" "Yellow"
    exit 1
}

$TestsPath = Resolve-Path $TestsPath
Write-ColorOutput "📁 Pasta de testes: $TestsPath" "Gray"

$correctionsCount = 0

function Fix-TestFile {
    param([string]$FilePath, [string]$TestId)
    
    if (-not (Test-Path $FilePath)) {
        Write-ColorOutput "⚠️  Arquivo não encontrado: $FilePath" "Yellow"
        return $false
    }
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    $fixed = $false
    
    switch ($TestId) {
        "TC002" {
            if ($content -notmatch '"nome"') {
                if ($content -match 'user_data.*"email"') {
                    $content = $content -replace '(\s+)"email":', '$1"nome": f"Teste Usuario {unique_str[:8]}",  # Campo obrigatório`n$1"email":'
                    $fixed = $true
                    Write-ColorOutput "  ✅ TC002: Campo 'nome' adicionado" "Green"
                }
            }
        }
        "TC003" {
            if ($content -match 'user_data = me_response\.json\(\)' -and $content -notmatch 'response_data') {
                $content = $content -replace 'user_data = me_response\.json\(\)', 'response_data = me_response.json()'
                $content = $content -replace 'assert isinstance\(user_data, dict\)', 'assert isinstance(response_data, dict)'
                $content = $content -replace 'assert "email" in user_data and user_data\["email"\]', 'assert "user" in response_data, "Response should contain ''user'' key"`n        user_data = response_data["user"]`n        assert "email" in user_data and user_data["email"]'
                $fixed = $true
                Write-ColorOutput "  ✅ TC003: Extração de 'user' corrigida" "Green"
            }
        }
        "TC005" {
            if ($content -match 'assert isinstance\(projects_data, list\)') {
                $content = $content -replace 'assert isinstance\(projects_data, list\), "Projects response format unexpected - not a list"', 'assert isinstance(projects_data, dict), "Projects response should be a dictionary"`n        assert "projetos" in projects_data, "Response should contain ''projetos'' key"`n        projetos_list = projects_data["projetos"]`n        assert isinstance(projetos_list, list), "Projetos should be a list"'
                $fixed = $true
                Write-ColorOutput "  ✅ TC005: Extração de 'projetos' corrigida" "Green"
            }
        }
        "TC006" {
            if ($content -match '"nome":\s*"Projeto Teste"') {
                $content = $content -replace '"nome":\s*"Projeto Teste",\s*"descricao":\s*"[^"]*"', '"nome_cliente": "Cliente Teste Automatizado TC006",`n        "data_base_estudo": "2024-01-01",`n        "saldo_inicial_caixa": 0'
                $fixed = $true
                Write-ColorOutput "  ✅ TC006: Campos corrigidos" "Green"
            }
            if ($content -match 'created_project_id = json_response\["id"\]' -and $content -notmatch '"projeto" in json_response') {
                $content = $content -replace 'assert "id" in json_response, "Response missing project ID"', 'assert "projeto" in json_response, "Response missing ''projeto'' key"`n        projeto = json_response["projeto"]`n        assert "id" in projeto'
                $content = $content -replace 'created_project_id = json_response\["id"\]', 'created_project_id = projeto["id"]'
                $content = $content -replace 'json_response\.get\("nome"\)', 'projeto.get("nome_cliente")'
                $fixed = $true
                Write-ColorOutput "  ✅ TC006: Extração de 'projeto' corrigida" "Green"
            }
        }
        "TC009" {
            if ($content -match 'SCENARIOS_URL.*cenarios/projetos') {
                $content = $content -replace 'SCENARIOS_URL\s*=\s*f"\{BASE_URL\}/api/cenarios/projetos"\s*', ''
                $fixed = $true
                Write-ColorOutput "  ✅ TC009: SCENARIOS_URL removida" "Green"
            }
            if ($content -match 'SCENARIOS_URL.*cenarios"') {
                $content = $content -replace 'SCENARIOS_URL', 'PROJECTS_URL'
                $fixed = $true
                Write-ColorOutput "  ✅ TC009: URL corrigida" "Green"
            }
            if ($content -match '"nome":\s*"Test Project"') {
                $content = $content -replace '"nome":\s*"Test Project[^"]*",\s*"descricao":\s*"[^"]*",\s*"nome_cliente":\s*"[^"]*",\s*"data_base":\s*"[^"]*"', '"nome_cliente": "Cliente Teste Cenário TC009",`n        "data_base_estudo": "2024-01-01",`n        "saldo_inicial_caixa": 0'
                $fixed = $true
                Write-ColorOutput "  ✅ TC009: Payload projeto corrigido" "Green"
            }
            if ($content -match 'project_id = project_data\.get\("id"\)' -and $content -notmatch '"projeto" in project_data') {
                $content = $content -replace 'project_data = project_resp\.json\(\)\s+project_id = project_data\.get\("id"\)', 'project_data = project_resp.json()`n    assert "projeto" in project_data, "Response missing ''projeto'' key"`n    projeto = project_data["projeto"]`n    project_id = projeto.get("id")'
                $fixed = $true
                Write-ColorOutput "  ✅ TC009: Extração projeto corrigida" "Green"
            }
            if ($content -match '"tipo":\s*"Realista"') {
                $content = $content -replace '"tipo":\s*"Realista",\s*"percentual_vendas":\s*\d+,\s*"ativo":\s*True', '"is_active": True'
                $content = $content -replace 'scenario_data\.get\("tipo"\)', '# Campo tipo não existe'
                $content = $content -replace 'scenario_data\.get\("percentual_vendas"\)', '# Campo percentual_vendas não existe'
                $content = $content -replace 'scenario_data\.get\("ativo"\)', 'scenario_data.get("is_active")'
                $fixed = $true
                Write-ColorOutput "  ✅ TC009: Payload cenário corrigido" "Green"
            }
            if ($content -match 'scenario_data = scenario_resp\.json\(\)' -and $content -notmatch '"cenario" in scenario_resp_data') {
                $content = $content -replace 'scenario_data = scenario_resp\.json\(\)', 'scenario_resp_data = scenario_resp.json()`n        assert "cenario" in scenario_resp_data, "Response missing ''cenario'' key"`n        scenario_data = scenario_resp_data["cenario"]'
                $content = $content -replace 'scenario_id = scenario_data\.get\("id"\) or scenario_data\.get\("cenario_id"\)', 'scenario_id = scenario_data.get("id")'
                $fixed = $true
                Write-ColorOutput "  ✅ TC009: Extração cenário corrigida" "Green"
            }
        }
    }
    
    if ($fixed -and $content -ne $originalContent) {
        try {
            Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
            return $true
        } catch {
            Write-ColorOutput "  ❌ Erro ao salvar: $_" "Red"
            return $false
        }
    }
    
    if (-not $fixed) {
        Write-ColorOutput "  ℹ️  Nenhuma correção necessária" "Gray"
    }
    
    return $false
}

$testFiles = @{
    "TC002_post_api_auth_register.py" = "TC002"
    "TC003_get_api_auth_me.py" = "TC003"
    "TC005_get_api_projetos.py" = "TC005"
    "TC006_post_api_projetos.py" = "TC006"
    "TC009_post_api_cenarios_projetos_projetoid_cenarios.py" = "TC009"
}

Write-ColorOutput "`n🔍 Procurando arquivos de teste..." "Cyan"

foreach ($file in $testFiles.Keys) {
    $filePath = Join-Path $TestsPath $file
    $testId = $testFiles[$file]
    Write-ColorOutput "`n📝 Processando $testId ($file)..." "Yellow"
    if (Fix-TestFile -FilePath $filePath -TestId $testId) {
        $correctionsCount++
    }
}

Write-ColorOutput "`n═══════════════════════════════════════════════════════" "Cyan"
Write-ColorOutput "✅ Correção automática concluída!" "Green"
Write-ColorOutput "📊 Arquivos corrigidos: $correctionsCount" "Cyan"
Write-ColorOutput "═══════════════════════════════════════════════════════" "Cyan"
Write-ColorOutput ""

