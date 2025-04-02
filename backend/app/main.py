from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime
from pydantic import BaseModel

from . import models, schemas
from .database import engine, get_db
from .services.code_execution import CodeExecutionService

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Code Execution Platform API",
    description="API for executing code in a secure environment",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize code execution service
code_execution_service = CodeExecutionService()

class CodeRequest(BaseModel):
    code: str

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
    # Create execution record
    db_execution = models.CodeExecution(
        code=execution.code,
        status="running",
        created_at=datetime.utcnow()
    )
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)

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

@app.post("/execute")
async def execute_code(request: CodeRequest):
    output, status, error_message = await code_execution_service.execute_code(request.code)
    if status == "error":
        raise HTTPException(status_code=500, detail=error_message)
    return {"status": status, "output": output}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 