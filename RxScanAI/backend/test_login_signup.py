"""
Test Login with Sign Up First Message
"""

import requests
import json

def test_login_signup_flow():
    base_url = "http://127.0.0.1:8000"
    
    print("🧪 Testing Login with Sign Up First Message")
    print("=" * 50)
    
    # Step 1: Try to login with non-existent user
    print("1. Testing login with non-existent user...")
    login_data = {
        "email": "nonexistent@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.text}")
        
        if response.status_code == 404:
            print("✅ Correctly identified non-existent user")
            print("✅ Shows 'Please sign up first' message")
        else:
            print("❌ Unexpected response for non-existent user")
    except Exception as e:
        print(f"❌ Error testing login: {e}")
    
    # Step 2: Create a user
    print("\n2. Creating a test user...")
    register_data = {
        "name": "Login Test User",
        "email": "logintest@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/register", json=register_data)
        if response.status_code == 200:
            print("✅ User created successfully")
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return
    
    # Step 3: Try to login with existing user
    print("\n3. Testing login with existing user...")
    try:
        response = requests.post(f"{base_url}/api/auth/login", json={
            "email": "logintest@example.com",
            "password": "test123456"
        })
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful for existing user")
        else:
            print(f"❌ Login failed for existing user: {response.text}")
    except Exception as e:
        print(f"❌ Error testing login: {e}")
    
    # Step 4: Try to login with wrong password
    print("\n4. Testing login with wrong password...")
    wrong_password_data = {
        "email": "logintest@example.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=wrong_password_data)
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.text}")
        
        if response.status_code == 401:
            print("✅ Correctly rejected wrong password")
        else:
            print("❌ Unexpected response for wrong password")
    except Exception as e:
        print(f"❌ Error testing wrong password: {e}")

if __name__ == "__main__":
    test_login_signup_flow()
