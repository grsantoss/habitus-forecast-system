import requests

BASE_URL = "http://localhost:5000"
AUTH_BASE_PATH = "/api/auth"
LOGIN_ENDPOINT = AUTH_BASE_PATH + "/login"
LOGOUT_ENDPOINT = AUTH_BASE_PATH + "/logout"

DEFAULT_EMAIL = "admin@habitus.com"
DEFAULT_PASSWORD = "admin123"

def test_post_api_auth_logout():
    try:
        # 1. Login to get JWT token
        login_payload = {
            "email": DEFAULT_EMAIL,
            "password": DEFAULT_PASSWORD
        }
        login_resp = requests.post(f"{BASE_URL}{LOGIN_ENDPOINT}", json=login_payload, timeout=30)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "access_token" in login_data, "JWT token missing in login response"
        token = login_data["access_token"]

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # 2. Call logout endpoint
        logout_resp = requests.post(f"{BASE_URL}{LOGOUT_ENDPOINT}", headers=headers, timeout=30)
        assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}"

        # 3. Verify token invalidation by calling /me endpoint (requires auth)
        me_resp = requests.get(f"{BASE_URL}{AUTH_BASE_PATH}/me", headers=headers, timeout=30)
        assert me_resp.status_code == 401 or me_resp.status_code == 403, \
            f"Token not invalidated after logout, /me status: {me_resp.status_code}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_api_auth_logout()
