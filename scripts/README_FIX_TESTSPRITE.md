# Script de Correção Automática - TestSprite

## 📋 Descrição

Este script aplica automaticamente correções conhecidas aos arquivos de teste gerados pelo TestSprite após regeneração.

## 🎯 Problema Resolvido

O TestSprite regenera os arquivos de teste automaticamente antes de executar, sobrescrevendo correções manuais. Este script aplica as correções automaticamente após a regeneração.

## 🚀 Como Usar

### Execução Manual

```powershell
# A partir da raiz do projeto
.\scripts\fix-testsprite-tests.ps1
```

### Execução Após TestSprite

Após executar o TestSprite, execute o script:

```powershell
# 1. Executar TestSprite
node C:\Users\Win10\AppData\Local\npm-cache\_npx\8ddf6bea01b2519d\node_modules\@testsprite\testsprite-mcp\dist\index.js generateCodeAndExecute

# 2. Aplicar correções automáticas
.\scripts\fix-testsprite-tests.ps1

# 3. Re-executar testes (opcional)
# node ... generateCodeAndExecute
```

## 🔧 Correções Aplicadas

### TC002 - POST /api/auth/register
- ✅ Adiciona campo `nome` obrigatório ao payload
- ✅ Ajusta validação de resposta para aceitar estrutura com `user` key

### TC003 - GET /api/auth/me
- ✅ Extrai `user` da resposta antes de acessar campos
- ✅ Corrige estrutura de resposta esperada

### TC005 - GET /api/projetos
- ✅ Extrai `projetos` da resposta (não lista diretamente)
- ✅ Corrige estrutura de resposta esperada

### TC006 - POST /api/projetos
- ✅ Usa campos corretos: `nome_cliente`, `data_base_estudo` (não `nome`, `descricao`)
- ✅ Extrai `projeto` da resposta antes de acessar `id`

### TC009 - POST /api/projetos/<id>/cenarios
- ✅ Corrige URL: `/api/projetos/{id}/cenarios` (não `/api/cenarios/projetos/{id}/cenarios`)
- ✅ Usa campos corretos para projeto: `nome_cliente`, `data_base_estudo`
- ✅ Usa campos corretos para cenário: `nome`, `descricao`, `is_active` (não `tipo`, `percentual_vendas`)
- ✅ Extrai `projeto` e `cenario` das respostas corretamente

## 📊 Saída do Script

O script exibe:
- ✅ Arquivos processados
- ✅ Correções aplicadas
- ✅ Contagem de arquivos corrigidos

Exemplo:
```
🔧 Iniciando correção automática dos testes do TestSprite...
📁 Pasta de testes: D:\...\testsprite_tests

🔍 Procurando arquivos de teste para corrigir...

📝 Processando TC002 (TC002_post_api_auth_register.py)...
  ✅ TC002: Campo 'nome' adicionado ao registro
  ✅ TC002: Validação de resposta ajustada

📝 Processando TC003 (TC003_get_api_auth_me.py)...
  ✅ TC003: Extração de 'user' da resposta corrigida

...

═══════════════════════════════════════════════════════
✅ Correção automática concluída!
📊 Arquivos corrigidos: 5
═══════════════════════════════════════════════════════
```

## ⚠️ Limitações

- O script corrige apenas padrões conhecidos
- Novos problemas podem requerer atualização do script
- Arquivos muito diferentes podem não ser corrigidos automaticamente

## 🏗️ Estrutura do Script

O script consiste em dois arquivos:

1. **`fix-testsprite-tests.ps1`** (PowerShell): Script principal que chama o script Python
2. **`fix_testsprite_tests.py`** (Python): Script que realiza as correções reais

Esta estrutura foi escolhida porque:
- Python é mais adequado para manipular código Python (regex, strings)
- Evita problemas de parsing do PowerShell com código Python
- Facilita manutenção e testes

## 🔄 Manutenção

Se novos problemas forem identificados:

1. Identifique o padrão do problema
2. Adicione a função de correção em `fix_testsprite_tests.py` (ex: `fix_tcXXX`)
3. Registre a função no dicionário `fixers` dentro de `main()`
4. Adicione o arquivo de teste no dicionário `test_files`
5. Teste a correção
6. Documente a correção neste README

### Exemplo de Adição de Nova Correção

```python
def fix_tc011(content):
    if 'problema_identificado' in content:
        content = content.replace('codigo_antigo', 'codigo_novo')
        return content, True
    return content, False

# Em main():
fixers = {
    # ... existentes ...
    'TC011': fix_tc011,
}

test_files = {
    # ... existentes ...
    'TC011_novo_teste.py': 'TC011',
}
```

## 📝 Notas

- O script preserva o encoding UTF-8 dos arquivos
- Correções são aplicadas apenas se os padrões forem encontrados
- O script não modifica arquivos que já estão corretos
- Requer Python 3.6+ instalado e no PATH

## 🐛 Solução de Problemas

### Erro: "Python não encontrado"
- Certifique-se de que Python está instalado: `python --version`
- Adicione Python ao PATH do sistema

### Erro: "Script Python não encontrado"
- Execute o script a partir da raiz do projeto
- Verifique se `scripts/fix_testsprite_tests.py` existe

### Correções não são aplicadas
- Verifique se os padrões no código Python correspondem ao conteúdo atual dos arquivos de teste
- Os arquivos podem já estar corretos (verifique a saída do script)

---

**Última atualização:** 2025-12-09

