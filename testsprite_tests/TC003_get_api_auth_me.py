import requests

BASE_URL = "http://localhost:5000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
ME_URL = f"{BASE_URL}/api/auth/me"
TIMEOUT = 30

def test_get_api_auth_me():
    credentials = {
        "email": "admin@habitus.com",
        "password": "admin123"
    }
    try:
        # Login to get JWT token
        login_resp = requests.post(LOGIN_URL, json=credentials, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        # Check for token in login response
        if "token" in login_data:
            token = login_data["token"]
        elif "access_token" in login_data:
            token = login_data["access_token"]
        else:
            assert False, "JWT token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # Get authenticated user data
        me_resp = requests.get(ME_URL, headers=headers, timeout=TIMEOUT)
        assert me_resp.status_code == 200, f"Failed to get authenticated user data: {me_resp.text}"
        response_data = me_resp.json()
        assert "user" in response_data, "Response should contain \'user\' key"
        me_data = response_data["user"]

        # Validate that user data contains 'email'
        assert isinstance(me_data, dict), "User data response is not a JSON object"
        assert "email" in me_data, f"Email not found in user data: {me_data}"
        assert me_data["email"] == credentials["email"], "Returned email does not match login email"

    except requests.RequestException as e:
        assert False, f"Request failed with exception: {e}"

test_get_api_auth_me()
