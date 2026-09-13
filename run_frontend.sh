#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export PATH="/Users/alina/.gemini/antigravity/scratch/nodejs/bin:$PATH"

echo "=== Starting RailETA Intelligence React Frontend ==="
cd "$DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 5173
