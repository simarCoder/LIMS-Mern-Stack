@echo off
title LIMS Bulk Patient Generator (200 Patients)
color 0B
cd /d "%~dp0"
echo ======================================================================
echo           Labora+ LIMS - Add 200 Test Patients to Database
echo ======================================================================
echo.
echo Generating 200 patients with orders and diagnostic results...
python backend/scripts/generate_bulk_patients.py --count 200
echo.
pause
