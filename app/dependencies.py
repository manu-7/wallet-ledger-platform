import uuid

from fastapi import Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.security import decode_token
from app.models import User 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
    token:str = Depends(oauth2_scheme),
    db:AsyncSession = Depends(get_db),
    ) -> User: 
    credetials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate":"Bearer"},
    )
    
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credetials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credetials_exception
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credetials_exception
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credetials_exception
    
    return user