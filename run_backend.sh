#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PYTHON_BIN="/Users/alina/.gemini/antigravity/scratch/.venv/bin/python"

echo "=== Starting RailETA Intelligence FastAPI Backend ==="
export PYTHONPATH="$DIR/backend"
"$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
