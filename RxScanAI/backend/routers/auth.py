"""
RxScan AI — Auth Router
JWT-based authentication with SQLite database
POST /api/auth/register  → Create new account
POST /api/auth/login     → Login and get token
GET  /api/auth/me        → Get current user info
"""

import os
import uuid
import re
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from jose import jwt, JWTError

from db.auth_db import create_user, get_user_by_email, get_user_by_id, verify_password, update_last_login, delete_user

router = APIRouter()

# ─── Config ───────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "rxscan-dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# ─── Models ───────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ─── Helper Functions ─────────────────────────────────────────────────────────

def _is_valid_email(email: str) -> bool:
    """Simple email validation"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def _create_token(user_id: str) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def _verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        # Validate email
        if not _is_valid_email(user_data.email):
            raise ValueError("Invalid email format")
        
        # Validate password
        if len(user_data.password) < 6:
            raise ValueError("Password must be at least 6 characters")
        
        # Create new user in database
        user_id = str(uuid.uuid4())
        new_user = create_user(
            user_id=user_id,
            name=user_data.name.strip(),
            email=user_data.email.lower().strip(),
            password=user_data.password
        )
        
        # Create token
        token = _create_token(user_id)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": new_user["id"],
                "name": new_user["name"],
                "email": new_user["email"],
                "created_at": new_user["created_at"],
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login existing user"""
    try:
        # Validate email
        if not _is_valid_email(credentials.email):
            raise ValueError("Invalid email format")
        
        # Find user by email
        user = get_user_by_email(credentials.email.lower().strip())
        
        if not user:
            raise HTTPException(status_code=404, detail="please be sign up first")
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        update_last_login(user["id"])
        
        # Create token
        token = _create_token(user["id"])
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "created_at": user["created_at"],
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current logged-in user info"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>"
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    user_id = _verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"],
    }

@router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout and delete user from database"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>"
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    user_id = _verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Delete user from database
    success = delete_user(user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Logged out and account deleted successfully"}

@router.delete("/auth/delete-account")
async def delete_account(authorization: Optional[str] = Header(None)):
    """Permanently delete user account and all data"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    # Extract token from "Bearer <token>"
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    user_id = _verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Delete user from database
    success = delete_user(user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Account deleted permanently"}

class DeleteAccountRequest(BaseModel):
    email: str
    password: str

@router.post("/auth/delete-account-by-email")
async def delete_account_by_email(request: DeleteAccountRequest):
    """Delete account using email and password (for logged out users)"""
    # Find user by email
    user = get_user_by_email(request.email.lower().strip())
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Delete user from database
    success = delete_user(user["id"])
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete account")
    
    return {"success": True, "message": "Account deleted permanently"}
