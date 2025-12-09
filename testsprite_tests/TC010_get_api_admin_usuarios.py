import requests

BASE_URL = "http://localhost:5000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
ADMIN_USERS_URL = f"{BASE_URL}/api/admin/usuarios"
TIMEOUT = 30

def test_get_api_admin_usuarios():
    # Admin credentials from PRD default
    admin_credentials = {
        "email": "admin@habitus.com",
        "password": "admin123"
    }
    try:
        # Login as admin to get JWT token
        login_resp = requests.post(LOGIN_URL, json=admin_credentials, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        token = None
        if "token" in login_data:
            token = login_data["token"]
        elif "access_token" in login_data:
            token = login_data["access_token"]
        else:
            # If response has exactly one key and its value is string token
            for v in login_data.values():
                if isinstance(v, str):
                    token = v
                    break
        assert token is not None, "JWT token not found in login response"
        
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        # Get list of admin users
        users_resp = requests.get(ADMIN_USERS_URL, headers=headers, timeout=TIMEOUT)
        assert users_resp.status_code == 200, f"Failed to get admin users, status {users_resp.status_code}"
        users_data = users_resp.json()

        # If users_data is dict and contains a list at some key, extract it, else assert is list
        if isinstance(users_data, dict):
            # Try common keys
            if "data" in users_data and isinstance(users_data["data"], list):
                users_list = users_data["data"]
            elif "usuarios" in users_data and isinstance(users_data["usuarios"], list):
                users_list = users_data["usuarios"]
            else:
                # If dict does not have list under common keys, fail assertion
                assert False, "Admin users response dict does not contain user list under expected keys"
        elif isinstance(users_data, list):
            users_list = users_data
        else:
            assert False, "Admin users response is not a list or dict with user list"

        # Validate that the response list contains entries with required fields
        if users_list:
            first_user = users_list[0]
            assert isinstance(first_user, dict), "User entry is not a dictionary"
            assert "email" in first_user, "User entry missing email"
            assert "role" in first_user, "User entry missing role"
            assert isinstance(first_user.get("role"), str), "User role is not a string"
    except requests.RequestException as e:
        assert False, f"Request exception occurred: {e}"

test_get_api_admin_usuarios()
