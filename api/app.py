"""
Main FastAPI Application for TrueForge Agent.
Configures CORS, API routes, and serves the interactive frontend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .routes import router

app = FastAPI(
    title="TrueForge Agent Harness",
    description="Autonomous Agent Harness with MCP Catalog Server, Python Layout Sandbox, and Provable Approval Gate.",
    version="1.0.0"
)

# Configurable CORS origins via environment variable
cors_env = os.getenv("CORS_ORIGINS", "*")
allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Mount frontend static files if directory exists
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/app", StaticFiles(directory=frontend_dir, html=True), name="frontend")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TrueForge-Agent-Harness",
        "mcp_server": "active",
        "sandbox_runner": "active",
        "approval_gate": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True)
