import os
import requests
import json

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8003")

# Test registration
print("Testing registration...")
response = requests.post(f"{BASE_URL}/api/auth/register", json={
    "username": "testuser",
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "password123"
})
print(f"Registration: {response.status_code}")
print(response.json())

# Test login
print("\nTesting login...")
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "username": "testuser",
    "password": "password123"
})
print(f"Login: {response.status_code}")
data = response.json()
print(data)
token = data.get("access_token")

# Test protected endpoint
print("\nTesting protected endpoint...")
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
print(f"Me: {response.status_code}")
print(response.json())
