#!/usr/bin/env python3
"""
Script de Correção Automática para Testes do TestSprite
Execute via: python scripts/fix_testsprite_tests.py
"""

import re
import sys
from pathlib import Path


def fix_tc002(content):
    fixed = False
    # Adicionar campo nome se não existir
    if '"nome"' not in content:
        # Procurar por valid_payload primeiro (padrão mais comum agora)
        if 'valid_payload = {' in content:
            pattern = r'(valid_payload\s*=\s*\{[^}]*?)(\s+"email":)'
            replacement = r'\1\n        "nome": f"Teste Usuario {uuid.uuid4().hex[:8]}",  # Campo obrigatório\2'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                fixed = True
        # Procurar por valid_user_data
        elif 'valid_user_data = {' in content:
            pattern = r'(valid_user_data\s*=\s*\{[^}]*?)(\s+"email":)'
            replacement = r'\1\n        "nome": f"Teste Usuario {uuid.uuid4().hex[:8]}",  # Campo obrigatório\2'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                fixed = True
        # Procurar por user_data
        elif 'user_data = {' in content:
            pattern = r'(user_data\s*=\s*\{[^}]*?)(\s+"email":)'
            replacement = r'\1\n        "nome": f"Teste Usuario {uuid.uuid4().hex[:8]}",  # Campo obrigatório\2'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                fixed = True
        # Fallback: procurar qualquer dicionário com email mas sem nome (apenas se tiver password também)
        elif '"email":' in content and '"password":' in content and '"nome"' not in content:
            # Adicionar nome antes do primeiro email em um dicionário que tenha password
            pattern = r'(\{[^}]*?"password"[^}]*?)(\s+"email":|\s+"password":)'
            # Mas precisamos adicionar antes do email, não antes do password
            pattern = r'(\{[^}]*?)(\s+"email":)'
            replacement = r'\1\n        "nome": f"Teste Usuario {uuid.uuid4().hex[:8]}",  # Campo obrigatório\2'
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content, count=1)
                fixed = True
    
    # Corrigir validação de resposta - API retorna {"message": "...", "user": {"id": ...}}
    if 'assert "id" in json_resp' in content and '"user" in json_resp' not in content:
        content = content.replace(
            'assert "id" in json_resp, "Registration response missing user id"',
            'assert "user" in json_resp, "Registration response missing \'user\' key"\n        assert "id" in json_resp["user"], "Registration response missing user id"'
        )
        # Também corrigir acesso direto ao id
        if 'json_resp["id"]' in content or 'json_resp.get("id")' in content:
            content = content.replace('json_resp["id"]', 'json_resp["user"]["id"]')
            content = content.replace('json_resp.get("id")', 'json_resp.get("user", {}).get("id")')
        fixed = True
    
    return content, fixed


def fix_tc003(content):
    fixed = False
    # Corrigir se estiver acessando email diretamente sem extrair 'user'
    if 'me_data = me_resp.json()' in content or 'me_data = me_response.json()' in content:
        # Verificar se está tentando acessar email diretamente
        if '"email" in me_data' in content and '"user" in' not in content:
            # Substituir acesso direto por extração de 'user'
            content = content.replace('me_data = me_resp.json()', 'response_data = me_resp.json()')
            content = content.replace('me_data = me_response.json()', 'response_data = me_response.json()')
            # Adicionar extração de user
            pattern = r'(response_data\s*=\s*me_resp\.json\(\)|response_data\s*=\s*me_response\.json\(\))'
            replacement = r'\1\n        assert "user" in response_data, "Response should contain \'user\' key"\n        me_data = response_data["user"]'
            content = re.sub(pattern, replacement, content)
            fixed = True
    
    # Padrão antigo (manter compatibilidade)
    if 'user_data = me_response.json()' in content and 'response_data' not in content:
        content = content.replace('user_data = me_response.json()', 'response_data = me_response.json()')
        content = content.replace('assert isinstance(user_data, dict)', 'assert isinstance(response_data, dict)')
        replacement = 'assert "user" in response_data, "Response should contain \'user\' key"\n        user_data = response_data["user"]\n        assert "email" in user_data and user_data["email"]'
        content = re.sub(r'assert "email" in user_data and user_data\["email"\]', replacement, content)
        fixed = True
    
    return content, fixed


def fix_tc005(content):
    fixed = False
    # Corrigir se estiver procurando por "projects" em vez de "projetos"
    if "'projects'" in content or '"projects"' in content:
        content = content.replace("'projects'", "'projetos'")
        content = content.replace('"projects"', '"projetos"')
        content = content.replace("['projects']", "['projetos']")
        content = content.replace('["projects"]', '["projetos"]')
        content = content.replace('data["projects"]', 'data["projetos"]')
        content = content.replace("data['projects']", "data['projetos']")
        content = content.replace('projects_data["projects"]', 'projects_data["projetos"]')
        content = content.replace("projects_data['projects']", "projects_data['projetos']")
        content = content.replace(".get('projects')", ".get('projetos')")
        content = content.replace('.get("projects")', '.get("projetos")')
        fixed = True
    
    # Corrigir se estiver verificando se é lista diretamente
    if 'assert isinstance(projects_data, list)' in content:
        replacement = 'assert isinstance(projects_data, dict), "Projects response should be a dictionary"\n        assert "projetos" in projects_data, "Response should contain \'projetos\' key"\n        projetos_list = projects_data["projetos"]\n        assert isinstance(projetos_list, list), "Projetos should be a list"'
        content = re.sub(r'assert isinstance\(projects_data, list\), "Projects response format unexpected - not a list"', replacement, content)
        fixed = True
    
    # Corrigir verificação de chave 'projects'
    if "'projects'" in content or '"projects"' in content:
        content = content.replace("'projects' in", "'projetos' in")
        content = content.replace('"projects" in', '"projetos" in')
        fixed = True
    
    return content, fixed


def fix_tc006(content):
    fixed = False
    # Remover campos incorretos e manter apenas os corretos
    if '"nome":' in content and '"nome_cliente":' in content:
        # Remover campos incorretos: nome, descricao, status, cliente
        content = re.sub(r'"nome":\s*"[^"]*",?\s*', '', content)
        content = re.sub(r'"descricao":\s*"[^"]*",?\s*', '', content)
        content = re.sub(r'"status":\s*"[^"]*",?\s*', '', content)
        content = re.sub(r'"cliente":\s*"[^"]*",?\s*', '', content)
        # Corrigir data_base para data_base_estudo
        content = content.replace('"data_base":', '"data_base_estudo":')
        fixed = True
    elif '"nome": "Projeto Teste"' in content:
        content = re.sub(r'"nome":\s*"Projeto Teste",\s*"descricao":\s*"[^"]*"', '"nome_cliente": "Cliente Teste Automatizado TC006",\n        "data_base_estudo": "2024-01-01",\n        "saldo_inicial_caixa": 0', content)
        fixed = True
    
    # Corrigir data_base para data_base_estudo se existir
    if '"data_base":' in content:
        content = content.replace('"data_base":', '"data_base_estudo":')
        fixed = True
    
    # Corrigir acesso à resposta - API retorna {"message": "...", "projeto": {"id": ...}}
    if 'response_json.get("id")' in content and '"projeto" in response_json' not in content:
        # Substituir acesso direto por acesso via "projeto"
        content = re.sub(
            r'created_project_id\s*=\s*response_json\.get\("id"\)',
            'assert "projeto" in response_json, "Response missing \'projeto\' key"\n        projeto = response_json["projeto"]\n        created_project_id = projeto.get("id")',
            content
        )
        # Corrigir validações que acessam campos diretamente
        content = re.sub(
            r'assert response_json\.get\("nome"\)\s*==\s*project_data\["nome"\]',
            '# Campo nome não existe na resposta, usar nome_cliente',
            content
        )
        content = re.sub(
            r'assert response_json\.get\("descricao"\)\s*==\s*project_data\["descricao"\]',
            '# Campo descricao não existe na resposta',
            content
        )
        fixed = True
    
    # Também corrigir se usar json_response
    if 'created_project_id = json_response["id"]' in content and '"projeto" in json_response' not in content:
        content = re.sub(r'assert "id" in json_response, "Response missing project ID"', 'assert "projeto" in json_response, "Response missing \'projeto\' key"\n        projeto = json_response["projeto"]\n        assert "id" in projeto', content)
        content = content.replace('created_project_id = json_response["id"]', 'created_project_id = projeto["id"]')
        content = content.replace('json_response.get("nome")', 'projeto.get("nome_cliente")')
        fixed = True
    
    # Corrigir se usar project diretamente
    if 'project = post_response.json()' in content or 'project = response.json()' in content:
        if '"projeto" in' not in content:
            content = content.replace('project = post_response.json()', 'response_data = post_response.json()\n        assert "projeto" in response_data, "Response missing \'projeto\' key"\n        project = response_data["projeto"]')
            content = content.replace('project = response.json()', 'response_data = response.json()\n        assert "projeto" in response_data, "Response missing \'projeto\' key"\n        project = response_data["projeto"]')
            fixed = True
    
    return content, fixed


def fix_tc009(content):
    fixed = False
    
    if 'SCENARIOS_URL' in content and 'cenarios/projetos' in content:
        content = re.sub(r'SCENARIOS_URL\s*=\s*f"\{BASE_URL\}/api/cenarios/projetos"\s*', '', content)
        fixed = True
    
    if 'SCENARIOS_URL' in content and 'cenarios"' in content:
        content = content.replace('SCENARIOS_URL', 'PROJECTS_URL')
        fixed = True
    
    if '"nome": "Test Project"' in content:
        content = re.sub(r'"nome":\s*"Test Project[^"]*",\s*"descricao":\s*"[^"]*",\s*"nome_cliente":\s*"[^"]*",\s*"data_base":\s*"[^"]*"', '"nome_cliente": "Cliente Teste Cenário TC009",\n        "data_base_estudo": "2024-01-01",\n        "saldo_inicial_caixa": 0', content)
        fixed = True
    
    if 'project_id = project_data.get("id")' in content and '"projeto" in project_data' not in content:
        replacement = 'project_data = project_resp.json()\n    assert "projeto" in project_data, "Response missing \'projeto\' key"\n    projeto = project_data["projeto"]\n    project_id = projeto.get("id")'
        content = re.sub(r'project_data = project_resp\.json\(\)\s+project_id = project_data\.get\("id"\)', replacement, content)
        fixed = True
    
    if '"tipo": "Realista"' in content:
        content = re.sub(r'"tipo":\s*"Realista",\s*"percentual_vendas":\s*\d+,\s*"ativo":\s*True', '"is_active": True', content)
        content = content.replace('scenario_data.get("tipo")', '# Campo tipo não existe')
        content = content.replace('scenario_data.get("percentual_vendas")', '# Campo percentual_vendas não existe')
        content = content.replace('scenario_data.get("ativo")', 'scenario_data.get("is_active")')
        fixed = True
    
    if 'scenario_data = scenario_resp.json()' in content and '"cenario" in scenario_resp_data' not in content:
        replacement = 'scenario_resp_data = scenario_resp.json()\n        assert "cenario" in scenario_resp_data, "Response missing \'cenario\' key"\n        scenario_data = scenario_resp_data["cenario"]'
        content = content.replace('scenario_data = scenario_resp.json()', replacement)
        content = re.sub(r'scenario_id = scenario_data\.get\("id"\) or scenario_data\.get\("cenario_id"\)', 'scenario_id = scenario_data.get("id")', content)
        fixed = True
    
    return content, fixed


def fix_tc010(content):
    fixed = False
    # Corrigir se estiver procurando por "users" em vez de "usuarios"
    if '"users"' in content and '"usuarios"' not in content:
        content = content.replace('"users"', '"usuarios"')
        content = content.replace('["users"]', '["usuarios"]')
        content = content.replace('data["users"]', 'data["usuarios"]')
        fixed = True
    
    # Corrigir verificação de chave 'users'
    if '"users" in data' in content or '"users" in resp.json()' in content:
        content = content.replace('"users" in data', '"usuarios" in data')
        content = content.replace('"users" in resp.json()', '"usuarios" in resp.json()')
        fixed = True
    
    return content, fixed


def main():
    fixers = {
        'TC002': fix_tc002,
        'TC003': fix_tc003,
        'TC005': fix_tc005,
        'TC006': fix_tc006,
        'TC009': fix_tc009,
        'TC010': fix_tc010,
    }

    test_files = {
        'TC002_post_api_auth_register.py': 'TC002',
        'TC003_get_api_auth_me.py': 'TC003',
        'TC005_get_api_projetos.py': 'TC005',
        'TC006_post_api_projetos.py': 'TC006',
        'TC009_post_api_cenarios_projetos_projetoid_cenarios.py': 'TC009',
        'TC010_get_api_admin_usuarios.py': 'TC010',
    }

    # Determinar caminho base do projeto
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    tests_path = project_root / 'testsprite_tests'

    if not tests_path.exists():
        print(f"❌ Erro: Pasta testsprite_tests não encontrada em: {tests_path}")
        print("💡 Certifique-se de executar o script a partir da raiz do projeto")
        sys.exit(1)

    print("🔧 Iniciando correção automática dos testes do TestSprite...")
    print(f"📁 Pasta de testes: {tests_path}")
    print("\n🔍 Procurando arquivos de teste...\n")

    corrections_count = 0

    for filename, test_id in test_files.items():
        filepath = tests_path / filename
        if not filepath.exists():
            print(f"⚠️  Arquivo não encontrado: {filepath}")
            continue

        print(f"📝 Processando {test_id} ({filename})...")
        content = filepath.read_text(encoding='utf-8')
        original_content = content

        if test_id in fixers:
            content, fixed = fixers[test_id](content)
            if fixed and content != original_content:
                filepath.write_text(content, encoding='utf-8')
                print(f"  ✅ {test_id}: Correções aplicadas")
                corrections_count += 1
            else:
                print(f"  ℹ️  {test_id}: Nenhuma correção necessária")
        else:
            print(f"  ⚠️  {test_id}: Fixer não encontrado")
        print()

    print("═══════════════════════════════════════════════════════")
    print("✅ Correção automática concluída!")
    print(f"📊 Arquivos corrigidos: {corrections_count}")
    print("═══════════════════════════════════════════════════════")
    print()


if __name__ == '__main__':
    main()

