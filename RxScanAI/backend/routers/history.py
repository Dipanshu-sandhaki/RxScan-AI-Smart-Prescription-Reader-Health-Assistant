# backend/routers/history.py
import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from jose import jwt, JWTError

from db.history_db import save_scan, get_user_history, delete_scans

SECRET_KEY = os.getenv("JWT_SECRET", "rxscan-dev-secret-key-change-in-production")
ALGORITHM = "HS256"

router = APIRouter()

def get_user_id_from_token(auth_header: str) -> str:
    if not auth_header:
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth_header.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class DeleteRequest(BaseModel):
    ids: List[str]

@router.post("/history")
async def save_history(scan_data: dict, authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    scan_id = save_scan(user_id, scan_data)
    return {"success": True, "id": scan_id}

@router.get("/history")
async def fetch_history(authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    return get_user_history(user_id)

@router.delete("/history")
async def delete_history(request: DeleteRequest, authorization: Optional[str] = Header(None)):
    user_id = get_user_id_from_token(authorization)
    delete_scans(user_id, request.ids)
    return {"success": True}