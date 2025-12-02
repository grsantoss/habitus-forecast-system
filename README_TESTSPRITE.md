# TestSprite - Habitus Forecast

## ✅ Configuração Completa

O projeto está configurado para testes automatizados com TestSprite.

### Arquivos Criados

- ✅ `testsprite_tests/tmp/code_summary.json` - Resumo do código
- ✅ `testsprite_tests/standard_prd.json` - PRD padronizado
- ✅ `testsprite_tests/testsprite_backend_test_plan.json` - Plano de testes
- ✅ `docs/TESTSPRITE_SETUP.md` - Guia de setup

### Plano de Testes Gerado

O TestSprite gerou **10 casos de teste** cobrindo:

1. ✅ Autenticação (login, registro, logout)
2. ✅ Gestão de projetos
3. ✅ Upload de planilhas
4. ✅ Dashboard
5. ✅ Cenários financeiros
6. ✅ Painel administrativo

## 🚀 Como Executar

### Passo 1: Iniciar Backend

```powershell
cd backend
. venv\Scripts\Activate.ps1
python src\main.py
```

Ou use o script:
```powershell
.\scripts\start-backend-for-tests.ps1
```

### Passo 2: Verificar Backend

```powershell
curl http://localhost:5000/api/health
```

### Passo 3: Executar Testes

O TestSprite executará automaticamente quando o backend estiver rodando.

## 📊 Status

- ✅ Configuração completa
- ✅ Plano de testes gerado
- ⏳ Aguardando backend estar rodando para executar

## 📝 Próximos Passos

1. Inicie o backend na porta 5000
2. Execute os testes via TestSprite
3. Revise os relatórios gerados

Consulte `docs/TESTSPRITE_SETUP.md` para detalhes completos.

