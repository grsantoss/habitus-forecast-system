import requests

BASE_URL = "http://localhost:5000"
LOGIN_PATH = "/api/auth/login"
TIMEOUT = 30

def test_post_api_auth_login():
    url = BASE_URL + LOGIN_PATH
    headers = {"Content-Type": "application/json"}

    # Valid credentials from PRD default_credentials
    valid_payload = {
        "email": "admin@habitus.com",
        "password": "admin123"
    }

    # Invalid credentials
    invalid_payload = {
        "email": "invalid@habitus.com",
        "password": "wrongpassword"
    }

    # Test valid login
    try:
        resp_valid = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Valid login request failed with exception: {e}"

    assert resp_valid.status_code == 200, f"Expected 200 OK for valid login, got {resp_valid.status_code}"
    try:
        json_valid = resp_valid.json()
    except ValueError:
        assert False, "Response from valid login is not valid JSON"

    # Check for token under 'token' or 'access_token'
    token_key = None
    if "token" in json_valid:
        token_key = "token"
    elif "access_token" in json_valid:
        token_key = "access_token"
    else:
        assert False, "JWT token not found in valid login response"

    assert isinstance(json_valid[token_key], str) and len(json_valid[token_key]) > 0, "Token is empty or not a string"

    # Test invalid login
    try:
        resp_invalid = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Invalid login request failed with exception: {e}"

    assert resp_invalid.status_code in {400, 401}, (
        f"Expected 400 or 401 status code for invalid login, got {resp_invalid.status_code}"
    )
    try:
        json_invalid = resp_invalid.json()
    except ValueError:
        assert False, "Response from invalid login is not valid JSON"

    # Optional: Check if error message or code present indicating failure
    assert (
        "error" in json_invalid or "message" in json_invalid or "detail" in json_invalid
    ), "Invalid login response should contain error or message field"


test_post_api_auth_login()
