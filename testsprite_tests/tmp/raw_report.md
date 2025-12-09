
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** habitus-forecast-system
- **Date:** 2025-12-09
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** post api auth login
- **Test Code:** [TC001_post_api_auth_login.py](./TC001_post_api_auth_login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/7f33f8a7-9d96-43c2-8899-106c99f391a1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** post api auth register
- **Test Code:** [TC002_post_api_auth_register.py](./TC002_post_api_auth_register.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 56, in <module>
  File "<string>", line 22, in test_post_api_auth_register
AssertionError: Expected 201, got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/6d74c3a9-c37d-46dd-8ffb-0677ba4ca2df
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** get api auth me
- **Test Code:** [TC003_get_api_auth_me.py](./TC003_get_api_auth_me.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 43, in <module>
  File "<string>", line 37, in test_get_api_auth_me
AssertionError: Email not found in user data: {'user': {'cargo': None, 'cnpj': None, 'created_at': '2025-11-21T14:21:57.690685', 'email': 'admin@habitus.com', 'empresa': None, 'id': 1, 'nome': 'Administrador', 'role': 'admin', 'status': 'active', 'telefone': None, 'updated_at': '2025-11-21T14:21:57.690685'}}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/dbb7f6b4-2e08-46c9-ab2e-bbc0c2126e10
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** post api auth logout
- **Test Code:** [TC004_post_api_auth_logout.py](./TC004_post_api_auth_logout.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/a4819a58-cafa-4bae-b541-b9d76003bd6e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** get api projetos
- **Test Code:** [TC005_get_api_projetos.py](./TC005_get_api_projetos.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/7448e687-a21b-418b-bb55-eeabeabbeaa1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** post api projetos
- **Test Code:** [TC006_post_api_projetos.py](./TC006_post_api_projetos.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 63, in <module>
  File "<string>", line 41, in test_post_api_projetos
AssertionError: Expected status code 201 but got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/d3973aec-d6bf-457a-a2d9-777af7586555
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** post api upload planilha
- **Test Code:** [TC007_post_api_upload_planilha.py](./TC007_post_api_upload_planilha.py)
- **Test Error:** Traceback (most recent call last):
  File "<string>", line 30, in test_post_api_upload_planilha
ModuleNotFoundError: No module named 'openpyxl'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 58, in <module>
  File "<string>", line 44, in test_post_api_upload_planilha
RuntimeError: openpyxl is required for this test to create valid Excel file

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/029b257b-bd81-43c1-83e9-0994914b554a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** get api dashboard stats
- **Test Code:** [TC008_get_api_dashboard_stats.py](./TC008_get_api_dashboard_stats.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/6c6861b4-d518-452e-8940-8143e7e865d0
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** post api cenarios projetos projetoid cenarios
- **Test Code:** [TC009_post_api_cenarios_projetos_projetoid_cenarios.py](./TC009_post_api_cenarios_projetos_projetoid_cenarios.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 97, in <module>
  File "<string>", line 48, in test_post_api_cenarios_projetos_projetoid_cenarios
AssertionError: Project creation failed, status code 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/80c5f53d-4404-45e6-99b4-717c61c2aae4
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** get api admin usuarios
- **Test Code:** [TC010_get_api_admin_usuarios.py](./TC010_get_api_admin_usuarios.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 66, in <module>
  File "<string>", line 50, in test_get_api_admin_usuarios
AssertionError: Admin users response dict does not contain user list under expected keys

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/607e64be-2532-4c46-9db6-6410ac8e988f/1611afeb-0e60-404f-a4c0-47544568b5de
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **40.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---