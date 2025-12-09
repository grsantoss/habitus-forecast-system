import requests

BASE_URL = "http://localhost:5000"
AUTH_LOGIN_PATH = "/api/auth/login"
PROJECTS_PATH = "/api/projetos"
SCENARIOS_CREATE_PATH_TEMPLATE = "/api/cenarios/projetos/{projeto_id}/cenarios"
TIMEOUT = 30

DEFAULT_CREDENTIALS = {
    "email": "admin@habitus.com",
    "password": "admin123"
}

def test_post_api_cenarios_projetos_projetoid_cenarios():
    session = requests.Session()
    token = None
    project_id = None
    scenario_id = None

    try:
        # Login to get JWT token
        login_response = session.post(
            BASE_URL + AUTH_LOGIN_PATH,
            json=DEFAULT_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed, status code {login_response.status_code}"
        login_json = login_response.json()
        token = login_json.get("token") or login_json.get("access_token")
        assert token is not None, "Token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Create a new project to attach scenario to
        project_payload = {
            "nome": "Test Project for Scenario",
            "descricao": "Project created for testing scenario creation"
        }
        project_response = session.post(
            BASE_URL + PROJECTS_PATH,
            json=project_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert project_response.status_code == 201, f"Project creation failed, status code {project_response.status_code}"
        project_json = project_response.json()
        project_id = project_json.get("id")
        assert project_id is not None, "Project ID not returned"

        # Create a financial scenario for the created project
        scenario_payload = {
            "nome": "Scenario Test",
            "descricao": "Scenario created during test",
            "tipo": "Realista",  # Assuming types like Pessimista, Realista, Otimista, Agressivo
            "percentual_variacao": 5.0  # Example valid scenario data
        }
        create_scenario_path = SCENARIOS_CREATE_PATH_TEMPLATE.format(projeto_id=project_id)
        scenario_response = session.post(
            BASE_URL + create_scenario_path,
            json=scenario_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert scenario_response.status_code == 201, f"Scenario creation failed, status code {scenario_response.status_code}"
        scenario_json = scenario_response.json()
        scenario_id = scenario_json.get("id")
        assert scenario_id is not None, "Scenario ID not returned"
        assert scenario_json.get("nome") == scenario_payload["nome"], "Scenario name mismatch"
        assert scenario_json.get("tipo") == scenario_payload["tipo"], "Scenario type mismatch"

    finally:
        # Cleanup scenario
        if token and scenario_id:
            try:
                session.delete(
                    f"{BASE_URL}/api/cenarios/{scenario_id}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=TIMEOUT
                )
            except Exception:
                pass

        # Cleanup project
        if token and project_id:
            try:
                session.delete(
                    f"{BASE_URL}/api/projetos/{project_id}",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_post_api_cenarios_projetos_projetoid_cenarios()
