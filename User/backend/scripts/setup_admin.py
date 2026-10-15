"""
Script to create default admin and user accounts for testing.
Run this after starting the backend server.
"""

import os
import requests
import sys

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8003")

def create_user(username, email, password, full_name=None):
    """Create a new user."""
    data = {
        "username": username,
        "email": email,
        "password": password
    }
    if full_name:
        data["full_name"] = full_name
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
        if response.status_code == 200:
            print(f"[OK] User '{username}' created successfully")
            return True
        else:
            print(f"[FAIL] Failed to create user '{username}': {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Error creating user '{username}': {e}")
        return False

def main():
    print("Creating default users...")
    print("-" * 50)
    
    # Create admin user
    admin_created = create_user(
        username="admin",
        email="admin@roadguard.ai",
        password="admin123",
        full_name="System Administrator"
    )
    
    # Create regular user
    user_created = create_user(
        username="user",
        email="user@roadguard.ai",
        password="user123",
        full_name="Test User"
    )
    
    print("-" * 50)
    if admin_created and user_created:
        print("[SUCCESS] All users created successfully!")
        print("\nLogin credentials:")
        print("Admin: admin / admin123")
        print("User: user / user123")
    else:
        print("[FAIL] Some users failed to create")
        sys.exit(1)

if __name__ == "__main__":
    main()
