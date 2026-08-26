@echo off
REM One-step start for the whole Privax stack.
REM Backend (Spring Boot, port 8080) launches in its own minimized window,
REM then the frontend (React, port 3000) runs in this window in the foreground.
REM Postgres is expected to already be running via docker-compose (port 5432).
start "privax-backend" /min "%~dp0run-backend.cmd"
set "BROWSER=none"
cd /d "%~dp0..\privax-ui"
call npm start
