from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.core.permissions import RoleEnum, can_user_access_opportunity
from app.models.opportunity import User

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Authenticate user via:
    1. JWT Bearer token in Authorization header
    2. Fallback to X-User-Id header (for flexible development & testing)
    3. Default to initial seed user (id=1)
    """
    token = credentials.credentials if credentials else None
    user: Optional[User] = None

    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload.get("sub")
            user = db.query(User).filter(User.id == user_id, User.is_active == True).first()

    # Fallback to dev header if no valid JWT provided
    if not user:
        dev_user_id = request.headers.get("X-User-Id")
        dev_user_role = request.headers.get("X-User-Role")
        
        if dev_user_id:
            try:
                user = db.query(User).filter(User.id == int(dev_user_id)).first()
            except Exception:
                pass

        if not user and dev_user_role:
            user = db.query(User).filter(User.role == dev_user_role.upper()).first()

    # Fallback to default user id=1
    if not user:
        user = db.query(User).filter(User.id == 1).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
        )

    return user

def require_roles(allowed_roles: List[str]):
    """Role-based access dependency."""
    def role_checker(current_user: User = Depends(get_current_user)):
        user_role = current_user.role.upper()
        allowed = [r.upper() for r in allowed_roles]
        if user_role not in allowed and "ADMIN" not in user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện thao tác này."
            )
        return current_user
    return role_checker
