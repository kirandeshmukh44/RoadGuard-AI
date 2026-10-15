import requests
import json
import os
from pathlib import Path

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8003")

# Create admin user directly in database
import sqlite3
conn = sqlite3.connect(Path(__file__).resolve().parents[2] / "road_monitoring.db")
cursor = conn.cursor()
# Update user role to admin
cursor.execute("UPDATE users SET role = 'admin' WHERE username = 'testuser2'")
conn.commit()
conn.close()

# Now login again to get new token
print("Testing login as admin...")
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "username": "testuser2",
    "password": "password123"
})
print(f"Login: {response.status_code}")
data = response.json()
print(data)
token = data.get("access_token")

# Test admin dashboard
print("\nTesting admin dashboard...")
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
print(f"Admin dashboard: {response.status_code}")
print(response.json())

# Test admin users
print("\nTesting admin users...")
response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
print(f"Admin users: {response.status_code}")
print(response.json())

# Test update user role
print("\nTesting update user role...")
response = requests.put(f"{BASE_URL}/api/admin/users/3/role", headers=headers, json={"role": "admin"})
print(f"Update user role: {response.status_code}")
print(response.json())

# Test update pothole status
print("\nTesting update pothole status...")
response = requests.put(f"{BASE_URL}/api/potholes/1", headers=headers, json={"status": "verified"})
print(f"Update pothole status: {response.status_code}")
print(response.json())

# Test generate report
print("\nTesting generate report...")
response = requests.post(f"{BASE_URL}/api/potholes/1/report", headers=headers)
print(f"Generate report: {response.status_code}")
print(response.json())

# Test get reports
print("\nTesting get reports...")
response = requests.get(f"{BASE_URL}/api/reports", headers=headers)
print(f"Get reports: {response.status_code}")
print(response.json())
