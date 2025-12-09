import requests

BASE_URL = "http://localhost:5000"
AUTH_URL = f"{BASE_URL}/api/auth/login"
PROJECTS_URL = f"{BASE_URL}/api/projetos"
DEFAULT_EMAIL = "admin@habitus.com"
DEFAULT_PASSWORD = "admin123"
TIMEOUT = 30

def test_get_api_projetos():
    # Login to get JWT token
    login_payload = {
        "email": DEFAULT_EMAIL,
        "password": DEFAULT_PASSWORD
    }
    try:
        login_resp = requests.post(AUTH_URL, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "access_token" in login_data, "JWT token not found in login response"
        token = login_data["access_token"]
    except Exception as e:
        raise AssertionError(f"Login request failed: {e}")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        # Request to list projects
        projects_resp = requests.get(PROJECTS_URL, headers=headers, timeout=TIMEOUT)
        assert projects_resp.status_code == 200, f"Expected 200 OK but got {projects_resp.status_code}"
        projects_data = projects_resp.json()
        # Validate projects_data structure (expect a list or dict as returned)
        assert isinstance(projects_data, (list, dict)), "Projects response is not a list or dict"
    except Exception as e:
        raise AssertionError(f"Failed to get projects: {e}")

test_get_api_projetos()