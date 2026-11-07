@echo off
setlocal
cd /d "%~dp0.."
title TrendMotion Studio Desktop
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\launch-desktop.ps1"
