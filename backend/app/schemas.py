from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CodeExecutionBase(BaseModel):
    code: str

class CodeExecutionCreate(CodeExecutionBase):
    pass

class CodeExecution(CodeExecutionBase):
    id: int
    output: Optional[str] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None 