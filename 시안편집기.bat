@echo off
rem Shinjeong site - variant editor (42). Double-click to start. Close this window to stop.
title Shinjeong variant editor
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\editor\editor.ps1"
if errorlevel 1 pause
