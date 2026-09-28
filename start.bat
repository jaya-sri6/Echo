@echo off
title Echo - Customer Experience Memory
echo ======================================================================
echo   ECHO - ORGANIZATIONAL CUSTOMER EXPERIENCE MEMORY
echo ======================================================================
echo.
set PYTHONPATH=.
echo Launching unified server on http://localhost:8000
echo Press Ctrl+C to stop.
echo.
py backend/app/main.py
pause
