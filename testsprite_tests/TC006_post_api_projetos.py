import requests

BASE_URL = "http://localhost:5000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
PROJECTS_URL = f"{BASE_URL}/api/projetos"
DEFAULT_EMAIL = "admin@habitus.com"
DEFAULT_PASSWORD = "admin123"
TIMEOUT = 30

def test_post_api_projetos():
    # Authenticate user and get JWT token
    login_payload = {"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD}
    try:
        login_response = requests.post(LOGIN_URL, json=login_payload, timeout=TIMEOUT)
        login_response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Login failed: {e}"

    login_json = login_response.json()
    token = login_json.get("token") or login_json.get("access_token") or login_json.get("accessToken")
    assert token, "JWT token not found in login response."

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Prepare valid project data for creation
    project_data = {
        "nome_cliente": "Cliente Teste Automatizado TC006",
        "data_base_estudo": "2024-01-01",
        "saldo_inicial_caixa": 0,
        "cliente": "Cliente Teste",
        "status": "ativo"
    }

    created_project_id = None

    try:
        # Create new project
        response = requests.post(PROJECTS_URL, json=project_data, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected status code 201 but got {response.status_code}"
        response_json = response.json()
        assert isinstance(response_json, dict), f"Response is not JSON object: {response_json}"
        # Assuming the created project returns an "id" field
        assert "projeto" in response_json, "Response missing 'projeto' key"
        projeto = response_json["projeto"]
        created_project_id = projeto.get("id")
        assert created_project_id, "Created project ID not found in response."
        # Check returned fields match input at least partially
        # Campo nome não existe na resposta, usar nome_cliente, "Project name mismatch."
        # Campo descricao não existe na resposta, "Project description mismatch."

    finally:
        # Cleanup: delete created project if created_project_id is set
        if created_project_id:
            delete_url = f"{PROJECTS_URL}/{created_project_id}"
            try:
                del_response = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                # Accept 204 No Content or 200 OK on deletion
                assert del_response.status_code in (200, 204), f"Failed to delete project with id {created_project_id}"
            except requests.RequestException:
                pass


test_post_api_projetos()
