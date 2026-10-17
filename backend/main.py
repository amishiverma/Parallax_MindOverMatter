"""
backend/main.py
Compatibility Entry Point — Project RedString

Re-exports the production FastAPI application instance from `backend.api.main`
so that both:
  1. `cd backend && uvicorn main:app --reload`
  2. `uvicorn backend.api.main:app --reload` (from project root)
boot the identical production engine without ModuleNotFoundError.
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path whether executed from root or /backend
_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

try:
    from backend.api.main import app
except ModuleNotFoundError:
    from api.main import app

__all__ = ["app"]
