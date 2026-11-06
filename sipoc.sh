#!/usr/bin/env bash
# Copyright 2026 Tobias Hofmann
# SPDX-License-Identifier: Apache-2.0
#
# One-stop start/stop script for the SIPOCs solution:
# backend (Spring Boot), frontend (Angular dev server), and mock data seeding.
#
# Usage:
#   ./sipoc.sh start   Start backend + frontend, wait until both are up, seed mock data
#   ./sipoc.sh stop    Stop backend + frontend
#   ./sipoc.sh status  Show whether backend/frontend are currently running

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
BACKEND_DIR="$ROOT_DIR/backend/server"
FRONTEND_DIR="$ROOT_DIR/frontend/sipoc-ui"
TESTS_DIR="$ROOT_DIR/tests"

BACKEND_PORT=8080
FRONTEND_PORT=4200
BACKEND_URL="http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

BACKEND_LOG="$RUN_DIR/backend.log"
FRONTEND_LOG="$RUN_DIR/frontend.log"

# Allow disabling mock-data seeding via env or CLI flag --no-seed
NO_SEED=""
for _arg in "$@"; do
  if [ "$_arg" = "--no-seed" ] || [ "$_arg" = "--no_seed" ]; then
    NO_SEED=1
  fi
done
if [ "${SIPOC_SKIP_SEED:-}" = "1" ] || [ "${SIPOC_SKIP_SEED:-}" = "true" ] || [ "${SKIP_SEED:-}" = "1" ]; then
  NO_SEED=1
fi

pid_on_port() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null | head -1
}

wait_for_url() {
  local url="$1" label="$2" attempts="${3:-40}"
  for _ in $(seq 1 "$attempts"); do
    if curl -sf -o /dev/null "$url"; then
      return 0
    fi
    sleep 3
  done
  echo "Timed out waiting for $label ($url)" >&2
  return 1
}

resolve_java_home() {
  if [ -n "${JAVA_HOME:-}" ] && "$JAVA_HOME/bin/java" -version >/dev/null 2>&1; then
    return 0
  fi
  if command -v brew >/dev/null 2>&1; then
    local brew_java
    brew_java="$(brew --prefix openjdk@25 2>/dev/null)"
    if [ -n "$brew_java" ] && [ -x "$brew_java/bin/java" ]; then
      export JAVA_HOME="$brew_java"
      return 0
    fi
  fi
  echo "Could not find a Java 25 runtime. Install it with: brew install openjdk@25" >&2
  return 1
}

start_backend() {
  local existing
  existing="$(pid_on_port "$BACKEND_PORT")"
  if [ -n "$existing" ]; then
    echo "Backend already running on port $BACKEND_PORT (pid $existing)"
    return 0
  fi

  resolve_java_home || return 1
  echo "Starting backend (JAVA_HOME=$JAVA_HOME) ..."
  ( cd "$BACKEND_DIR" && nohup ./mvnw spring-boot:run > "$BACKEND_LOG" 2>&1 & )

  wait_for_url "$BACKEND_URL/api/business-partners" "backend" 40 || {
    echo "Backend failed to start, see $BACKEND_LOG" >&2
    return 1
  }
  echo "Backend is up at $BACKEND_URL"
  SEEDED_BACKEND=1
}

seed_mock_data() {
  echo "Seeding mock data ..."
  ( cd "$TESTS_DIR" \
    && { [ -d node_modules ] || npm install; } \
    && npm run seed )
}

start_frontend() {
  local existing
  existing="$(pid_on_port "$FRONTEND_PORT")"
  if [ -n "$existing" ]; then
    echo "Frontend already running on port $FRONTEND_PORT (pid $existing)"
    return 0
  fi

  echo "Starting frontend ..."
  ( cd "$FRONTEND_DIR" \
    && { [ -d node_modules ] || npm install; } \
    && nohup npm start > "$FRONTEND_LOG" 2>&1 & )

  wait_for_url "$FRONTEND_URL" "frontend" 60 || {
    echo "Frontend failed to start, see $FRONTEND_LOG" >&2
    return 1
  }
  echo "Frontend is up at $FRONTEND_URL"
}

cmd_start() {
  mkdir -p "$RUN_DIR"
  SEEDED_BACKEND=0
  start_backend || exit 1
  if [ "$SEEDED_BACKEND" = "1" ] && [ -z "$NO_SEED" ]; then
    seed_mock_data
  else
    if [ -n "$NO_SEED" ]; then
      echo "Skipping mock data seeding (disabled by --no-seed or env)"
    else
      echo "Skipping mock data seeding (backend was already running)"
    fi
  fi
  start_frontend || exit 1
  echo
  echo "SIPOCs is up:"
  echo "  Frontend: $FRONTEND_URL"
  echo "  Backend:  $BACKEND_URL (Swagger UI: $BACKEND_URL/swagger-ui/index.html)"
}

stop_port() {
  local port="$1" label="$2"
  local pid
  pid="$(pid_on_port "$port")"
  if [ -z "$pid" ]; then
    echo "$label not running"
    return 0
  fi
  echo "Stopping $label (pid $pid, port $port) ..."
  kill "$pid" 2>/dev/null
  for _ in $(seq 1 10); do
    [ -z "$(pid_on_port "$port")" ] && break
    sleep 1
  done
  if [ -n "$(pid_on_port "$port")" ]; then
    echo "$label did not stop gracefully, forcing ..."
    kill -9 "$pid" 2>/dev/null
  fi
}

cmd_stop() {
  stop_port "$FRONTEND_PORT" "Frontend"
  stop_port "$BACKEND_PORT" "Backend"
}

cmd_status() {
  local backend_pid frontend_pid
  backend_pid="$(pid_on_port "$BACKEND_PORT")"
  frontend_pid="$(pid_on_port "$FRONTEND_PORT")"
  if [ -n "$backend_pid" ]; then
    echo "Backend:  running (pid $backend_pid, $BACKEND_URL)"
  else
    echo "Backend:  stopped"
  fi
  if [ -n "$frontend_pid" ]; then
    echo "Frontend: running (pid $frontend_pid, $FRONTEND_URL)"
  else
    echo "Frontend: stopped"
  fi
}

case "${1:-}" in
  start) cmd_start ;;
  stop) cmd_stop ;;
  status) cmd_status ;;
  *)
    echo "Usage: $0 {start|stop|status} [--no-seed]" >&2
    exit 1
    ;;
esac
