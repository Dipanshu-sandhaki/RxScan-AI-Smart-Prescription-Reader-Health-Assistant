"""
Test Authentication API
Run this to test signup/login functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth():
    print("🧪 Testing Authentication API...")
    
    # Test 1: Register new user
    print("\n1. Registering new user...")
    register_data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User registered: {result['user']['name']} ({result['user']['email']})")
            token = result['access_token']
        else:
            print(f"❌ Registration failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test 2: Login with registered user
    print("\n2. Logging in...")
    login_data = {
        "email": "test@example.com",
        "password": "test123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Login successful: {result['user']['name']}")
            token = result['access_token']
        else:
            print(f"❌ Login failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Test 3: Get current user info
    print("\n3. Getting user info...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ User info: {result['name']} ({result['email']})")
        else:
            print(f"❌ Get user failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n✅ Authentication test completed!")

if __name__ == "__main__":
    test_auth()
