import os
import requests
import json

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8003")

# Test registration with new user
print("Testing registration...")
response = requests.post(f"{BASE_URL}/api/auth/register", json={
    "username": "testuser2",
    "email": "test2@example.com",
    "full_name": "Test User 2",
    "password": "password123"
})
print(f"Registration: {response.status_code}")
data = response.json()
print(data)
token = data.get("access_token")

# Test login
print("\nTesting login...")
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "username": "testuser2",
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

# Test detect endpoint (without image - should fail)
print("\nTesting detect endpoint...")
response = requests.post(f"{BASE_URL}/api/detect", headers=headers, files={"file": ("test.txt", b"test", "text/plain")})
print(f"Detect (invalid file): {response.status_code}")
print(response.json())

# Test create pothole report
print("\nTesting create pothole report...")
response = requests.post(f"{BASE_URL}/api/potholes", headers=headers, data={
    "latitude": "12.9716",
    "longitude": "77.5946",
    "road_name": "Test Road",
    "description": "Test pothole",
    "severity": "medium",
    "confidence": "0.8"
})
print(f"Create pothole: {response.status_code}")
print(response.json())
pothole_id = response.json().get("id")

# Test get all potholes
print("\nTesting get all potholes...")
response = requests.get(f"{BASE_URL}/api/potholes", headers=headers)
print(f"Get potholes: {response.status_code}")
print(response.json())

# Test get my potholes
print("\nTesting get my potholes...")
response = requests.get(f"{BASE_URL}/api/users/me/potholes", headers=headers)
print(f"Get my potholes: {response.status_code}")
print(response.json())

# Test admin dashboard (should fail for regular user)
print("\nTesting admin dashboard (should fail)...")
response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
print(f"Admin dashboard: {response.status_code}")
print(response.json())
