from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta
from pydantic import BaseModel
import time
import os
from dotenv import load_dotenv

from . import models, schemas
from .database import engine, get_db
from .services.code_execution import CodeExecutionService

# Load environment variables
load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Code Execution Platform API",
    description="API for executing code in a secure environment",
    version="1.0.0"
)

# Security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])  # Configure with your domain
app.add_middleware(GZipMiddleware, minimum_size=1000)
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://54.215.251.174",
        "http://localhost:3000",
        "http://localhost"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
class RateLimiter:
    def __init__(self, max_requests: int, time_window: int):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = {}

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        if client_id not in self.requests:
            self.requests[client_id] = []
        
        # Remove old requests
        self.requests[client_id] = [t for t in self.requests[client_id] if now - t < self.time_window]
        
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        
        self.requests[client_id].append(now)
        return True

# Initialize rate limiter (10 requests per minute)
rate_limiter = RateLimiter(max_requests=10, time_window=60)

# Initialize code execution service
code_execution_service = CodeExecutionService()

class CodeRequest(BaseModel):
    code: str

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_id = request.client.host
    if not rate_limiter.is_allowed(client_id):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
    return await call_next(request)

@app.get("/")
async def root() -> Dict[str, Any]:
    return {"message": "Welcome to Code Execution Platform API"}

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {"status": "healthy"}

@app.post("/execute", response_model=schemas.CodeExecution)
async def execute_code(
    execution: schemas.CodeExecutionCreate,
    db: Session = Depends(get_db)
) -> models.CodeExecution:
    # Additional validation
    if len(execution.code) > 10000:
        raise HTTPException(status_code=400, detail="Code is too long (maximum 10,000 characters)")
    
    if not execution.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    # Create execution record
    db_execution = models.CodeExecution(
        code=execution.code,
        status="running",
        created_at=datetime.utcnow()
    )
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)

    try:
        # Execute code
        output, status, error_message = await code_execution_service.execute_code(execution.code)

        # Update execution record
        db_execution.output = output
        db_execution.status = status
        db_execution.error_message = error_message
        db_execution.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(db_execution)

        return db_execution
    except Exception as e:
        # Update execution record with error
        db_execution.status = "error"
        db_execution.error_message = str(e)
        db_execution.completed_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/executions", response_model=List[schemas.CodeExecution])
async def list_executions(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
) -> List[models.CodeExecution]:
    executions = db.query(models.CodeExecution)\
        .order_by(models.CodeExecution.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return executions

@app.get("/check-environment")
async def check_environment():
    is_ready = code_execution_service.check_environment()
    return {"is_ready": is_ready}

# Error handling
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 