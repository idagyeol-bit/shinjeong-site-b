@echo off
rem Shinjeong site - side-by-side compare (44). Left: final (origin/main). Right: this folder. Close this window to stop.
title Shinjeong compare
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\compare\compare.ps1"
if errorlevel 1 pause
