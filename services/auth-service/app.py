from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import jwt
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import httpx
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Authentication Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here-change-in-production")
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "https://keycloak.example.com")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "jade")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "optimal-platform")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "client-secret")

# Models
class UserLogin(BaseModel):
    username: str
    password: str

class UserInfo(BaseModel):
    id: str
    username: str
    email: str
    roles: list[str]
    permissions: list[str]

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user_info: UserInfo

# Mock user database (replace with real database in production)
USERS_DB = {
    "admin": {
        "id": "admin-001",
        "username": "admin",
        "email": "admin@optimal.com",
        "password": "admin123",  # In production, use hashed passwords
        "roles": ["admin", "user"],
        "permissions": ["read:all", "write:all", "admin:all"]
    },
    "developer": {
        "id": "dev-001",
        "username": "developer",
        "email": "dev@optimal.com",
        "password": "dev123",
        "roles": ["developer", "user"],
        "permissions": ["read:sbom", "read:vulns", "write:comments"]
    },
    "analyst": {
        "id": "analyst-001",
        "username": "analyst",
        "email": "analyst@optimal.com",
        "password": "analyst123",
        "roles": ["analyst", "user"],
        "permissions": ["read:all", "write:comments", "write:milestones"]
    }
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInfo:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = USERS_DB.get(username)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return UserInfo(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        roles=user["roles"],
        permissions=user["permissions"]
    )

def check_permission(user: UserInfo, required_permission: str) -> bool:
    """Check if user has required permission"""
    return required_permission in user.permissions or "admin:all" in user.permissions

# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "auth-service"}

@app.post("/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin):
    """User login endpoint"""
    user = USERS_DB.get(user_credentials.username)
    
    if not user or user["password"] != user_credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Return token and user info
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=24 * 3600,  # 24 hours in seconds
        user_info=UserInfo(
            id=user["id"],
            username=user["username"],
            email=user["email"],
            roles=user["roles"],
            permissions=user["permissions"]
        )
    )

@app.get("/auth/me", response_model=UserInfo)
async def get_current_user_info(current_user: UserInfo = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.post("/auth/verify")
async def verify_user_token(current_user: UserInfo = Depends(get_current_user)):
    """Verify user token is valid"""
    return {"valid": True, "user": current_user}

@app.get("/auth/permissions")
async def get_user_permissions(current_user: UserInfo = Depends(get_current_user)):
    """Get user permissions"""
    return {
        "username": current_user.username,
        "roles": current_user.roles,
        "permissions": current_user.permissions
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)

