#!/usr/bin/env bash
set -euo pipefail

######################## CONFIG – EDIT THESE ########################
# Frontend (Vite) project
FRONT_APP_DIR="$HOME/your-frontend"             # <-- absolute path
FRONT_HEALTH_URL="${FRONT_HEALTH_URL:-http://127.0.0.1:5173/}"
FRONT_GREP_PATTERN="(npm run dev|vite)"
# API (Node server.js) project (can be same dir as frontend if you keep server.js there)
API_DIR="$HOME/your-api"                         # <-- absolute path
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:5902/health}"
API_GREP_PATTERN="node .*server\\.js"

# Binaries (system install, no nvm)
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
NPM="$(command -v npm || true)"
NODE="$(command -v node || true)"
if [[ -z "$NPM" || -z "$NODE" ]]; then
  echo "[watchdog] ERROR: npm or node not found in PATH" >&2
  exit 1
fi

FRONT_START_CMD="$NPM run dev"
API_START_CMD="$NODE server.js"

# Files & dirs
FRONT_PID_FILE="$FRONT_APP_DIR/run/frontend.pid"
API_PID_FILE="$API_DIR/run/api.pid"
FRONT_LOG_DIR="$FRONT_APP_DIR/logs"
API_LOG_DIR="$API_DIR/logs"
mkdir -p "$FRONT_LOG_DIR" "$API_LOG_DIR" \
         "$(dirname "$FRONT_PID_FILE")" "$(dirname "$API_PID_FILE")"
FRONT_LOG="$FRONT_LOG_DIR/frontend.$(date +%F).log"
API_LOG="$API_LOG_DIR/api.$(date +%F).log"

# HTTP timeout
CURL_TIMEOUT=4
#####################################################################

is_healthy() {
  local url="$1"
  [[ -z "$url" ]] && return 1
  curl -fsSIL --max-time "$CURL_TIMEOUT" "$url" >/dev/null 2>&1
}

ensure_running() {
  local name="$1" workdir="$2" health_url="$3" pid_file="$4" grep_pat="$5" start_cmd="$6" log_file="$7"

  # 1) Healthy? done.
  if [[ -n "$health_url" ]] && is_healthy "$health_url"; then
    return 0
  fi

  # 2) PID file alive? done.
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      return 0
    else
      rm -f "$pid_file" || true
    fi
  fi

  # 3) Another matching process already running? done.
  if pgrep -f "$grep_pat" >/dev/null 2>&1; then
    return 0
  fi

  # 4) Start it
  echo "[watchdog] Starting $name ..."
  (
    cd "$workdir"
    nohup bash -lc "$start_cmd" >> "$log_file" 2>&1 &
    echo $! > "$pid_file"
  )
}

# Frontend (Vite)
ensure_running "frontend" "$FRONT_APP_DIR" "$FRONT_HEALTH_URL" "$FRONT_PID_FILE" "$FRONT_GREP_PATTERN" "$FRONT_START_CMD" "$FRONT_LOG"

# API (server.js)
ensure_running "api" "$API_DIR" "$API_HEALTH_URL" "$API_PID_FILE" "$API_GREP_PATTERN" "$API_START_CMD" "$API_LOG"
