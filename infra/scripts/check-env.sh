#!/usr/bin/env bash
set -e

echo "=== TrendMotion Studio Environment Verification ==="

command -v node >/dev/null 2>&1 && echo "[OK] Node.js: $(node -v)" || echo "[MISSING] Node.js is not installed."
command -v pnpm >/dev/null 2>&1 && echo "[OK] pnpm: $(pnpm -v)" || echo "[MISSING] pnpm is not installed."
command -v python3 >/dev/null 2>&1 && echo "[OK] Python: $(python3 --version)" || (command -v python >/dev/null 2>&1 && echo "[OK] Python: $(python --version)" || echo "[MISSING] Python is not installed.")
command -v docker >/dev/null 2>&1 && echo "[OK] Docker: $(docker --version)" || echo "[MISSING] Docker is not installed."

echo "==================================================="
