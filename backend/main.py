"""
backend/main.py
Compatibility Entry Point — Project RedString

Re-exports the production FastAPI application instance from `backend.api.main`
so that both `uvicorn backend.api.main:app` and `uvicorn main:app` boot
the identical production engine.
"""

from backend.api.main import app

__all__ = ["app"]
