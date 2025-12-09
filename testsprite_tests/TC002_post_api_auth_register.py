import requests
import uuid

BASE_URL = "http://localhost:5000"
REGISTER_PATH = "/api/auth/register"
TIMEOUT = 30

def test_post_api_auth_register():
    url = BASE_URL + REGISTER_PATH
    headers = {"Content-Type": "application/json"}

    # Generate unique user data for testing valid registration
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    valid_payload = {
        "nome": f"Teste Usuario {uuid.uuid4().hex[:8]}",  # Campo obrigatório
        "email": unique_email,
        "password": "StrongPassw0rd!"
    }

    # 1) Test successful registration with valid data
    response = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    try:
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        json_resp = response.json()
        assert "user" in json_resp, "Registration response missing 'user' key"
        assert "id" in json_resp["user"], "Registration response missing user id"
    finally:
        # Cleanup: attempt to delete the created user if possible (assuming admin endpoint or delete endpoint not specified, skip actual deletion)
        pass

    # 2) Test duplicate registration with the same email
    response_dup = requests.post(url, json=valid_payload, headers=headers, timeout=TIMEOUT)
    assert response_dup.status_code in (400, 409), f"Expected 400 or 409 for duplicate registration, got {response_dup.status_code}"

    # 3) Test registration with invalid email
    invalid_email_payload = {
        "email": "invalid-email-format",
        "password": "StrongPassw0rd!"
    }
    response_invalid_email = requests.post(url, json=invalid_email_payload, headers=headers, timeout=TIMEOUT)
    assert response_invalid_email.status_code == 400, f"Expected 400 for invalid email, got {response_invalid_email.status_code}"

    # 4) Test registration with missing password
    missing_password_payload = {
        "email": f"{uuid.uuid4()}@example.com"
    }
    response_missing_password = requests.post(url, json=missing_password_payload, headers=headers, timeout=TIMEOUT)
    assert response_missing_password.status_code == 400, f"Expected 400 for missing password, got {response_missing_password.status_code}"

    # 5) Test registration with weak password (assuming password policy)
    weak_password_payload = {
        "email": f"{uuid.uuid4()}@example.com",
        "password": "123"
    }
    response_weak_password = requests.post(url, json=weak_password_payload, headers=headers, timeout=TIMEOUT)
    assert response_weak_password.status_code == 400, f"Expected 400 for weak password, got {response_weak_password.status_code}"

test_post_api_auth_register()
