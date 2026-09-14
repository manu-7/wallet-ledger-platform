import uuid
from datetime import datetime

from pydantic import BaseModel,EmailStr,ConfigDict

class UserCreate(BaseModel):
    email:EmailStr
    password:str
    
    
class UserLogin(BaseModel):
    email:EmailStr
    password:str
    
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:uuid.UUID
    email:EmailStr
    created_at:datetime
    
    
class Token(BaseModel):
    access_token:str
    refresh_token:str
    token_type:str="bearer"