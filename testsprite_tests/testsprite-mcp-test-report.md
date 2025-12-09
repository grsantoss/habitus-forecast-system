# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** habitus-forecast-system
- **Date:** 2025-12-09
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

### Requirement: Autenticação e Autorização
- **Description:** Sistema de login com JWT, controle de acesso por roles (admin/usuário), gestão de status de usuários

#### Test TC001
- **Test Name:** post api auth login
- **Test Code:** [TC001_post_api_auth_login.py](./TC001_post_api_auth_login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/4660db43-e4c7-478a-9fc8-4102639c4b27
- **Status:** ✅ Passed
- **Severity:** HIGH
- **Analysis / Findings:** Login funciona corretamente com credenciais válidas. O endpoint retorna token JWT conforme esperado. A autenticação básica está funcionando adequadamente.

---

#### Test TC002
- **Test Name:** post api auth register
- **Test Code:** [TC002_post_api_auth_register.py](./TC002_post_api_auth_register.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 64, in <module>
  File "<string>", line 29, in test_post_api_auth_register
AssertionError: Expected 200/201, got 400
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/dadaf095-1cc6-43ee-be75-0a0496c26c71
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** O teste de registro falhou retornando status 400. Possíveis causas: validação de dados faltando campos obrigatórios, email já existente no banco, ou formato de dados inválido. É necessário verificar os campos obrigatórios do endpoint de registro e garantir que o teste envie todos os dados necessários.

---

#### Test TC003
- **Test Name:** get api auth me
- **Test Code:** [TC003_get_api_auth_me.py](./TC003_get_api_auth_me.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/8f905518-60e0-4a95-9720-45754e7da86d
- **Status:** ✅ Passed
- **Severity:** MEDIUM
- **Analysis / Findings:** O endpoint /api/auth/me retorna corretamente os dados do usuário autenticado quando um token JWT válido é fornecido. A autenticação por token está funcionando adequadamente.

---

#### Test TC004
- **Test Name:** post api auth logout
- **Test Code:** [TC004_post_api_auth_logout.py](./TC004_post_api_auth_logout.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 36, in <module>
  File "<string>", line 34, in test_post_api_auth_logout
AssertionError: Token should be invalid after logout but got status 200
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/c28c25dd-4bed-4b5a-95a3-3e963d0d92ac
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** O logout não está invalidando o token JWT corretamente. Após o logout, o token ainda é aceito (status 200 ao tentar usar o token). Isso representa um problema de segurança - tokens devem ser invalidados após logout. Sugestão: implementar blacklist de tokens ou usar refresh tokens com revogação.

---

### Requirement: Gestão de Projetos Financeiros
- **Description:** CRUD completo de projetos, associação a usuários, múltiplos projetos por usuário

#### Test TC005
- **Test Name:** get api projetos
- **Test Code:** [TC005_get_api_projetos.py](./TC005_get_api_projetos.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/1b7ebb78-3ec0-4a02-bb31-5d7cd606ec7c
- **Status:** ✅ Passed
- **Severity:** HIGH
- **Analysis / Findings:** O endpoint de listagem de projetos funciona corretamente, retornando a lista de projetos do usuário autenticado. A filtragem por usuário está funcionando adequadamente.

---

#### Test TC006
- **Test Name:** post api projetos
- **Test Code:** [TC006_post_api_projetos.py](./TC006_post_api_projetos.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 50, in <module>
  File "<string>", line 36, in test_post_api_projetos
AssertionError: Project creation failed: {"message":"Nome do cliente e data base são obrigatórios"}
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/0ecdf05e-d6d0-4703-87c7-d4b247c3c8fb
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** O teste de criação de projeto falhou porque não enviou os campos obrigatórios "nome_cliente" e "data_base". O endpoint está validando corretamente os campos obrigatórios, mas o teste precisa ser ajustado para incluir todos os campos necessários. A validação do backend está funcionando corretamente.

---

### Requirement: Processamento de Planilhas
- **Description:** Upload e processamento automático de planilhas Excel (Habitus Forecast/FDC-REAL), extração de dados específicos, histórico de uploads

#### Test TC007
- **Test Name:** post api upload planilha
- **Test Code:** [TC007_post_api_upload_planilha.py](./TC007_post_api_upload_planilha.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 53, in <module>
  File "<string>", line 20, in test_post_api_upload_planilha
AssertionError: JWT token not found in login response
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/976397e6-3ad7-4906-855e-3a40178ee9d2
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** O teste falhou porque não conseguiu obter o token JWT da resposta de login. Isso pode indicar que o formato da resposta de login mudou ou o teste não está extraindo o token corretamente. É necessário verificar o formato da resposta do endpoint de login e ajustar o teste para extrair o token corretamente.

---

### Requirement: Dashboard Financeiro
- **Description:** Visualização de métricas, gráfico Habitus Forecast vs FDC-REAL, gráfico de categorias, configuração de saldo inicial

#### Test TC008
- **Test Name:** get api dashboard stats
- **Test Code:** [TC008_get_api_dashboard_stats.py](./TC008_get_api_dashboard_stats.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/41222993-d50d-4374-a4fc-167be469037c
- **Status:** ✅ Passed
- **Severity:** HIGH
- **Analysis / Findings:** O endpoint de estatísticas do dashboard funciona corretamente, retornando dados financeiros agregados para o usuário autenticado. A autenticação está funcionando e os dados são retornados no formato esperado.

---

### Requirement: Gestão de Cenários
- **Description:** Criação de múltiplos cenários (Pessimista, Realista, Otimista, Agressivo), configuração de percentuais, análise e comparação de cenários

#### Test TC009
- **Test Name:** post api cenarios projetos projetoid cenarios
- **Test Code:** [TC009_post_api_cenarios_projetos_projetoid_cenarios.py](./TC009_post_api_cenarios_projetos_projetoid_cenarios.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 83, in <module>
  File "<string>", line 34, in test_post_api_cenarios_projetos_projetoid_cenarios
AssertionError: Project creation failed with status 400
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/24977647-b910-4196-94a7-995c01dfd323
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** O teste falhou ao tentar criar um cenário porque primeiro precisa criar um projeto, e a criação do projeto falhou com status 400. O teste depende do TC006 (criação de projeto) que também falhou. É necessário corrigir primeiro o teste de criação de projeto para que este teste possa funcionar. O teste precisa criar um projeto válido antes de tentar criar um cenário.

---

### Requirement: Painel Administrativo
- **Description:** Gestão de usuários, logs do sistema, estatísticas administrativas, visualização de todos os projetos

#### Test TC010
- **Test Name:** get api admin usuarios
- **Test Code:** [TC010_get_api_admin_usuarios.py](./TC010_get_api_admin_usuarios.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 72, in <module>
  File "<string>", line 62, in test_get_api_admin_usuarios
AssertionError: Expected list of users, got <class 'dict'>
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/7a8e0a03-0c66-4db8-b4a4-8e8caa970000/b660bff9-ded6-4adc-89c7-a6602966568d
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** O endpoint retorna um dicionário ao invés de uma lista de usuários. O teste esperava uma lista, mas o endpoint provavelmente retorna um objeto com estrutura como `{"users": [...]}` ou `{"data": [...]}`. É necessário verificar o formato real da resposta do endpoint e ajustar o teste para extrair a lista corretamente, ou ajustar o endpoint para retornar diretamente uma lista se isso for o comportamento esperado.

---

## 3️⃣ Coverage & Matching Metrics

- **40.00%** of tests passed

| Requirement                    | Total Tests | ✅ Passed | ❌ Failed |
|--------------------------------|-------------|-----------|-----------|
| Autenticação e Autorização     | 4           | 2         | 2         |
| Gestão de Projetos Financeiros | 2           | 1         | 1         |
| Processamento de Planilhas     | 1           | 0         | 1         |
| Dashboard Financeiro            | 1           | 1         | 0         |
| Gestão de Cenários             | 1           | 0         | 1         |
| Painel Administrativo          | 1           | 0         | 1         |
| **TOTAL**                      | **10**      | **4**     | **6**     |

---

## 4️⃣ Key Gaps / Risks

### Resumo Executivo
40% dos testes passaram completamente. Os principais problemas identificados estão relacionados a:
1. **Validação de dados**: Alguns testes não estão enviando todos os campos obrigatórios
2. **Segurança**: O logout não invalida tokens JWT adequadamente
3. **Formato de resposta**: Alguns endpoints retornam estruturas diferentes do esperado pelos testes
4. **Dependências entre testes**: Alguns testes falham porque dependem de outros testes que também falharam

### Riscos Identificados

#### 🔴 Crítico - Segurança
- **Logout não invalida tokens**: O endpoint de logout não está invalidando tokens JWT, permitindo que tokens continuem válidos após logout. Isso representa um risco de segurança significativo.

#### 🟡 Alto - Funcionalidade
- **Validação de campos obrigatórios**: Os testes de criação de projeto e registro não estão enviando todos os campos obrigatórios. Embora o backend esteja validando corretamente, os testes precisam ser ajustados.
- **Formato de resposta inconsistente**: O endpoint de listagem de usuários retorna um dicionário ao invés de uma lista direta, causando confusão nos testes.

#### 🟢 Médio - Qualidade
- **Dependências entre testes**: O teste de criação de cenários falha porque depende da criação de projeto, que também falhou. Testes devem ser mais independentes ou a ordem de execução deve ser garantida.
- **Extração de token**: O teste de upload falha porque não consegue extrair o token JWT corretamente da resposta de login.

### Recomendações

1. **Implementar invalidação de tokens no logout**: Adicionar blacklist de tokens ou usar refresh tokens com revogação
2. **Ajustar testes para incluir todos os campos obrigatórios**: Revisar os testes TC002, TC006 e TC009 para garantir que todos os campos necessários sejam enviados
3. **Padronizar formato de resposta**: Decidir se endpoints devem retornar listas diretamente ou objetos com estrutura, e documentar isso claramente
4. **Melhorar isolamento de testes**: Garantir que cada teste seja independente ou implementar setup/teardown adequado
5. **Revisar formato de resposta de login**: Garantir que o token JWT seja retornado de forma consistente e documentada

### Próximos Passos

1. Corrigir o problema de invalidação de tokens no logout (prioridade alta)
2. Ajustar os testes que falharam para incluir todos os campos obrigatórios
3. Re-executar os testes após as correções
4. Implementar melhorias de segurança sugeridas
5. Documentar formato de resposta de todos os endpoints da API

---

**Relatório gerado automaticamente pelo TestSprite AI Team**

