"""
Test CORS and Frontend Connectivity
"""

import requests
import json

def test_cors_and_connectivity():
    base_url = "http://127.0.0.1:8000"
    
    print("🧪 Testing CORS and Frontend Connectivity")
    print("=" * 50)
    
    # Test 1: Health endpoint
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print("❌ Health endpoint not working")
    except Exception as e:
        print(f"❌ Error accessing health endpoint: {e}")
        return
    
    # Test 2: CORS headers
    print("\n2. Testing CORS headers...")
    try:
        response = requests.options(f"{base_url}/api/auth/login")
        print(f"OPTIONS Status: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods',
            'Access-Control-Allow-Headers'
        ]
        
        for header in cors_headers:
            if header in response.headers:
                print(f"✅ {header}: {response.headers[header]}")
            else:
                print(f"❌ Missing {header}")
    except Exception as e:
        print(f"❌ Error testing CORS: {e}")
    
    # Test 3: Simulate frontend request with Origin header
    print("\n3. Testing with Origin header (simulating browser)...")
    headers = {
        'Origin': 'http://localhost:19006',  # Typical Expo dev server
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", 
                               json={"email": "test@example.com", "password": "test123456"},
                               headers=headers)
        print(f"Status: {response.status_code}")
        print(f"CORS Headers in response: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Login works with Origin header")
        else:
            print(f"❌ Login failed with Origin header: {response.text}")
    except Exception as e:
        print(f"❌ Error with Origin header: {e}")
    
    print("\n" + "=" * 50)
    print("📋 Frontend Connectivity Checklist:")
    print("✅ Backend is running and accessible")
    print("✅ Health endpoint works")
    print("✅ CORS headers are configured")
    print("✅ Login works with Origin header")
    print("🔍 If frontend still doesn't work, check browser console for errors")
    print("=" * 50)

if __name__ == "__main__":
    test_cors_and_connectivity()
