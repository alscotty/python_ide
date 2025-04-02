from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from .database import Base

class CodeExecution(Base):
    __tablename__ = "code_executions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(Text)
    output = Column(Text)
    status = Column(String)  # success, error, running
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True) 