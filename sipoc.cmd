@echo off
REM Copyright 2026 Tobias Hofmann
REM SPDX-License-Identifier: Apache-2.0
setlocal
set SCRIPT_DIR=%~dp0
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%sipoc.ps1" %*
