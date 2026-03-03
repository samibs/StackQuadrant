#!/bin/bash
# Wrapper for PM2 cron_restart: runs the command, then sleeps forever.
# PM2 cron_restart only works on RUNNING processes — if the process exits
# and autorestart is false, PM2 won't restart it on schedule.
# This wrapper keeps the process alive (sleeping) so PM2 can kill and
# restart it on the cron schedule.

set -euo pipefail

echo "[cron-runner] Starting: $*"
echo "[cron-runner] Timestamp: $(date -Iseconds)"

# Run the actual command
"$@"
EXIT_CODE=$?

echo "[cron-runner] Command finished with exit code $EXIT_CODE"
echo "[cron-runner] Sleeping until next cron_restart..."

# Sleep forever — PM2 will kill and restart this on the cron schedule
exec sleep infinity
