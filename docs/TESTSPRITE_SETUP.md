# Guia de Testes com TestSprite - Habitus Forecast

## 📋 Pré-requisitos

1. Backend Flask rodando na porta 5000
2. Banco de dados inicializado
3. Node.js instalado (para executar TestSprite)

## 🚀 Passos para Executar Testes

### 1. Iniciar Backend

**Opção A: Via Script PowerShell**
```powershell
.\scripts\start-backend-for-tests.ps1
```

**Opção B: Manual**
```powershell
cd backend
. venv\Scripts\Activate.ps1
python src\main.py
```

**Opção C: Via Docker**
```powershell
docker-compose up -d backend
```

### 2. Verificar se Backend Está Rodando

```powershell
curl http://localhost:5000/api/health
```

Deve retornar:
```json
{"status": "ok", "message": "Habitus Forecast API está funcionando"}
```

### 3. Executar TestSprite

O TestSprite já foi configurado. Para executar os testes:

```powershell
cd "D:\000 Habitus Forecast\habitus-forecast-system"
node C:\Users\Win10\AppData\Local\npm-cache\_npx\8ddf6bea01b2519d\node_modules\@testsprite\testsprite-mcp\dist\index.js generateCodeAndExecute
```

### 4. Verificar Resultados

Os relatórios serão gerados em:
- `testsprite_tests/tmp/raw_report.md` - Relatório bruto
- `testsprite_tests/testsprite-mcp-test-report.md` - Relatório completo (após processamento)

## 📊 Plano de Testes Gerado

O TestSprite gerou um plano com os seguintes casos de teste:

1. **TC001** - POST /api/auth/login - Teste de login
2. **TC002** - POST /api/auth/register - Teste de registro
3. **TC003** - GET /api/auth/me - Obter usuário atual
4. **TC004** - POST /api/auth/logout - Teste de logout
5. **TC005** - GET /api/projetos - Listar projetos
6. **TC006** - POST /api/projetos - Criar projeto
7. **TC007** - POST /api/upload-planilha - Upload de planilha
8. **TC008** - GET /api/dashboard/stats - Estatísticas do dashboard
9. **TC009** - POST /api/projetos/<id>/cenarios - Criar cenário
10. **TC010** - GET /api/admin/usuarios - Listar usuários (admin)

## 🔧 Configuração

### Arquivos de Configuração TestSprite

- `testsprite_tests/tmp/code_summary.json` - Resumo do código
- `testsprite_tests/standard_prd.json` - PRD padronizado
- `testsprite_tests/testsprite_backend_test_plan.json` - Plano de testes

### Credenciais de Teste

- **Email:** admin@habitus.com
- **Senha:** admin123

## 📝 Notas Importantes

1. **Backend deve estar rodando:** TestSprite precisa que o servidor esteja ativo na porta 5000
2. **Banco de dados:** Certifique-se de que o banco está inicializado com dados de seed
3. **CORS:** Backend deve permitir requisições de localhost
4. **Token JWT:** Testes que requerem autenticação usarão o token retornado do login

## 🐛 Troubleshooting

### Erro: "Connection refused"
- Verifique se o backend está rodando: `curl http://localhost:5000/api/health`
- Verifique se a porta 5000 está livre: `netstat -ano | findstr :5000`

### Erro: "Database locked"
- Pare outras instâncias do backend
- Verifique se não há outro processo usando o banco SQLite

### Erro: "Module not found"
- Instale dependências: `pip install -r backend/requirements.txt`

## 📚 Documentação TestSprite

Para mais informações sobre TestSprite, consulte a documentação oficial.

