# Code Execution Platform

A modern web application featuring an integrated terminal environment for executing Python code and other development tasks.

## Features

- Integrated terminal environment with full command-line capabilities
- Real-time code execution and output display
- Secure code execution environment
- Modern React frontend with TypeScript and Tailwind CSS
- FastAPI backend with PostgreSQL database
- Support for Python 3.11+ with pandas and scipy libraries

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI, Python 3.11+
- Database: PostgreSQL
- Code Editor: Monaco Editor
- Terminal: xterm.js

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Docker (optional, for containerized deployment)

## Project Structure

```
.
├── frontend/           # Next.js frontend application
├── backend/           # FastAPI backend application
└── docker/           # Docker configuration files
```

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate 
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```

## Security Considerations

- All code execution is performed in isolated containers
- Rate limiting is implemented to prevent abuse
- Input validation and sanitization are enforced
- Regular security updates are maintained
