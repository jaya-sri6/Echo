#!/usr/bin/env bash
echo "======================================================================"
echo "  ECHO - ORGANIZATIONAL CUSTOMER EXPERIENCE MEMORY"
echo "======================================================================"
echo ""
export PYTHONPATH=.
echo "Launching unified server on http://localhost:8000"
python3 backend/app/main.py
