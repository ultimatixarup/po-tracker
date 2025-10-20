#!/usr/bin/env bash
# keep both node apps alive by checking pidfiles and restarting when needed
set -euo pipefail

# --- config ---
APPS=(
  "/home/bttf/usermanagement-main/frontend"
  "/home/bttf/usermanagement-man/backend"
)
START_CMD="npm run start"        # change if your start script has a different name
LOG_ROOT="/var/log/usermgmt-monitor"
LOCKFILE="/tmp/ensure_usermgmt.lock"

mkdir -p "$LOG_ROOT"

# load node/npm env for non-interactive shells (nvm, etc.)
# quietly source common locations; ignore if not present
[[ -f /home/bttf/.profile ]] && . /home/bttf/.profile || true
[[ -f /home/bttf/.bashrc ]] && . /home/bttf/.bashrc || true
[[ -s /home/bttf/.nvm/nvm.sh ]] && . /home/bttf/.nvm/nvm.sh || true

is_pid_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

ensure_app() {
  local app_dir="$1"
  local name
  name="$(basename "$app_dir")"
  local pidfile="$app_dir/.app.pid"
  local logfile="$LOG_ROOT/${name}.log"

  # if pidfile exists and live, nothing to do
  if [[ -f "$pidfile" ]]; then
    local pid
    pid="$(cat "$pidfile" || true)"
    if is_pid_running "$pid"; then
      echo "$(date -Is) [$name] OK pid=$pid" >> "$logfile"
      return 0
    fi
  fi

  # (re)start
  echo "$(date -Is) [$name] starting..." >> "$logfile"
  cd "$app_dir"

  # start in background, capture PID of launched process
  # - use bash -lc so npm sees the right env; setsid to detach
  nohup bash -lc "$START_CMD" >> "$logfile" 2>&1 &
  newpid=$!
  echo "$newpid" > "$pidfile"

  # brief grace, then verify
  sleep 3
  if is_pid_running "$newpid"; then
    echo "$(date -Is) [$name] started pid=$newpid" >> "$logfile"
  else
    echo "$(date -Is) [$name] ERROR: failed to start" >> "$logfile"
    exit 1
  fi
}

# single instance guard
exec 9>"$LOCKFILE"
flock -n 9 || exit 0

for d in "${APPS[@]}"; do
  if [[ -d "$d" ]]; then
    ensure_app "$d"
  else
    echo "$(date -Is) [$(basename "$d")] WARN: dir not found: $d" >> "$LOG_ROOT/errors.log"
  fi
done
