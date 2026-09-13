#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PYTHON_BIN="/Users/alina/.gemini/antigravity/scratch/.venv/bin/python"

echo "=== Generating Synthetic Data & Training ML Model ==="
export PYTHONPATH="$DIR/backend"
"$PYTHON_BIN" "$DIR/backend/app/ml/train_model.py"
