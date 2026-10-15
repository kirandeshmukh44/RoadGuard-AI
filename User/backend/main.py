"""Compatibility entry point; application code lives in :mod:`app.main`."""

import uvicorn

from app.config import API_PORT
from app.main import app


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=API_PORT)
