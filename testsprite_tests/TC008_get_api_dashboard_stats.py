import requests

BASE_URL = "http://localhost:5000"
LOGIN_ENDPOINT = "/api/auth/login"
DASHBOARD_STATS_ENDPOINT = "/api/dashboard/stats"

HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

DEFAULT_EMAIL = "admin@habitus.com"
DEFAULT_PASSWORD = "admin123"


def test_get_api_dashboard_stats():
    try:
        # Step 1: Authenticate and obtain JWT token
        login_payload = {
            "email": DEFAULT_EMAIL,
            "password": DEFAULT_PASSWORD
        }
        login_response = requests.post(
            BASE_URL + LOGIN_ENDPOINT, 
            json=login_payload, 
            headers=HEADERS, 
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, \
            f"Login failed with status code {login_response.status_code}: {login_response.text}"
        
        login_data = login_response.json()
        assert "access_token" in login_data, "No access_token found in login response"
        token = login_data["access_token"]

        # Step 2: Use token to get dashboard stats
        auth_headers = {
            "Authorization": f"Bearer {token}"
        }
        dashboard_response = requests.get(
            BASE_URL + DASHBOARD_STATS_ENDPOINT,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert dashboard_response.status_code == 200, \
            f"Dashboard stats retrieval failed: {dashboard_response.status_code} {dashboard_response.text}"
        
        stats_data = dashboard_response.json()
        assert isinstance(stats_data, dict), "Dashboard stats response is not a JSON object"
        # Basic checks on likely keys (example)
        # Since schema is not specified for dashboard stats, check that response is not empty
        assert len(stats_data) > 0, "Dashboard stats response is empty"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {str(e)}"


test_get_api_dashboard_stats()
