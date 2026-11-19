@echo off
title LIMS Database Reset Utility
color 0C
cd /d "%~dp0"
echo ======================================================================
echo              Labora+ LIMS - Reset Database to Clean Lab
echo ======================================================================
echo.
python backend/scripts/reset_clean_lab.py
echo.
pause
