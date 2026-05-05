"""
Test Delete Account Functionality
"""

import requests
import json

def test_delete_account():
    base_url = "http://127.0.0.1:8000"
    
    print("🧪 Testing Delete Account Functionality")
    print("=" * 50)
    
    # Step 1: Create a test user
    print("1. Creating test user...")
    register_data = {
        "name": "Delete Test User",
        "email": "deletetest@example.com",
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
    
    # Step 2: Test delete account with token
    print("\n2. Testing delete account...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.delete(f"{base_url}/api/auth/delete-account", headers=headers)
        print(f"Delete response status: {response.status_code}")
        print(f"Delete response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Delete account successful!")
        else:
            print("❌ Delete account failed")
    except Exception as e:
        print(f"❌ Error deleting account: {e}")
    
    # Step 3: Verify user is deleted
    print("\n3. Verifying user deletion...")
    try:
        response = requests.post(f"{base_url}/api/auth/login", json={
            "email": "deletetest@example.com",
            "password": "test123456"
        })
        
        if response.status_code == 401:
            print("✅ User successfully deleted (login fails)")
        else:
            print("❌ User still exists (login works)")
    except Exception as e:
        print(f"❌ Error verifying deletion: {e}")

if __name__ == "__main__":
    test_delete_account()
