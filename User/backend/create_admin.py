#!/usr/bin/env python3
"""
Script to create default admin user with credentials: admin / admin@123
Run this script to initialize the admin user in the database.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.database import init_db, get_db, User
from app.auth import get_password_hash
from app.config import DATABASE_URL

def create_admin_user():
    """Create the default admin user if it doesn't exist."""
    init_db()
    db = next(get_db())
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user:
            print("Admin user already exists!")
            print(f"Username: {admin_user.username}")
            print(f"Email: {admin_user.email}")
            print(f"Role: {admin_user.role.value}")
            return
        
        # Create admin user
        hashed_password = get_password_hash("admin@123")
        
        admin_user = User(
            username="admin",
            email="admin@roadguard.ai",
            full_name="System Administrator",
            hashed_password=hashed_password,
            role="admin",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print("=" * 50)
        print("📋 Admin Credentials:")
        print("=" * 50)
        print(f"Username: admin")
        print(f"Password: admin@123")
        print(f"Email: admin@roadguard.ai")
        print(f"Role: admin")
        print("=" * 50)
        print("\n🔐 Please change the password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()