"""
Test Logout with Database Deletion Functionality
"""

import requests
import json

def test_logout_delete():
    base_url = "http://127.0.0.1:8000"
    
    print("🧪 Testing Logout with Database Deletion")
    print("=" * 50)
    
    # Step 1: Create a test user
    print("1. Creating test user...")
    register_data = {
        "name": "Logout Delete Test",
        "email": "logoutdelete@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register", json=register_data)
        if response.status_code == 200:
            token = response.json()["access_token"]
            print(f"✅ User created successfully")
            print(f"Token: {token[:50]}...")
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            print(f"Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return
    
    # Step 2: Verify user exists in database
    print("\n2. Verifying user exists in database...")
    try:
        response = requests.post(f"{base_url}/api/auth/login", json={
            "email": "logoutdelete@example.com",
            "password": "test123456"
        })
        
        if response.status_code == 200:
            print("✅ User exists in database (login successful)")
        else:
            print("❌ User not found in database")
            return
    except Exception as e:
        print(f"❌ Error verifying user: {e}")
        return
    
    # Step 3: Test logout with database deletion
    print("\n3. Testing logout with database deletion...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(f"{base_url}/api/auth/logout", headers=headers)
        print(f"Logout response status: {response.status_code}")
        print(f"Logout response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Logout with database deletion successful!")
        else:
            print("❌ Logout with database deletion failed")
    except Exception as e:
        print(f"❌ Error deleting account: {e}")
    
    # Step 4: Verify user is deleted from database
    print("\n4. Verifying user is deleted from database...")
    try:
        response = requests.post(f"{base_url}/api/auth/login", json={
            "email": "logoutdelete@example.com",
            "password": "test123456"
        })
        
        if response.status_code == 401:
            print("✅ User successfully deleted from database (login fails)")
        else:
            print("❌ User still exists in database (login works)")
    except Exception as e:
        print(f"❌ Error verifying deletion: {e}")

if __name__ == "__main__":
    test_logout_delete()
