"""
Main FastAPI Application for TrueForge Agent.
Configures CORS, API routes, and serves the interactive frontend.
Loads environment variables from .env for Groq LLM and security configuration.
"""
import os
from pathlib import Path

# Load .env file before any other imports
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routes import router

app = FastAPI(
    title="TrueForge Agent Harness",
    description="Autonomous Agent Harness with MCP Catalog Server, Python Layout Sandbox, and Provable Approval Gate.",
    version="1.0.0"
)

# Configurable CORS origins via environment variable
cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TrueForge-Agent-Harness",
        "mcp_server": "active",
        "sandbox_runner": "active",
        "approval_gate": "active"
    }

# Mount frontend built production assets if dist exists, otherwise fallback to frontend dir
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend-dist")
elif os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True)
