#!/usr/bin/env bash
#
# One-command deploy for Thuyết Khách Hành → self-hosted VM.
#
# Pushes the local code to the VM, installs deps, rebuilds the frontend,
# and restarts the systemd service.
#
# Usage:
#   VM_HOST=1.2.3.4 ./deploy.sh            # full deploy (rsync + npm install + build + restart)
#   VM_HOST=1.2.3.4 ./deploy.sh --fast     # skip `npm install` (code/UI changes only)
#   VM_HOST=1.2.3.4 ./deploy.sh --logs     # just tail the live service logs
#
# Override defaults via env vars, e.g.:
#   VM_HOST=1.2.3.4 SSH_KEY=~/my.key ./deploy.sh
#
set -euo pipefail

# ---- config (override via env) ----------------------------------------------
SSH_KEY="${SSH_KEY:-$(dirname "$0")/havitalk-ssh-key-2026-06-16.key}"
VM_USER="${VM_USER:-ubuntu}"
VM_HOST="${VM_HOST:?Set VM_HOST=<server ip/host>, e.g. VM_HOST=1.2.3.4 ./deploy.sh}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/game}"
SERVICE="${SERVICE:-game}"
HEALTH_PORT="${HEALTH_PORT:-8788}"
# -----------------------------------------------------------------------------

SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)
REMOTE="${VM_USER}@${VM_HOST}"

c() { printf "\033[1;36m▸ %s\033[0m\n" "$*"; }
ok() { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }

# --- handle flags ------------------------------------------------------------
if [[ "${1:-}" == "--logs" ]]; then
  c "Tailing logs for $SERVICE (Ctrl-C to stop)…"
  exec ssh "${SSH_OPTS[@]}" "$REMOTE" "sudo journalctl -u $SERVICE -f -n 50"
fi

SKIP_INSTALL=false
[[ "${1:-}" == "--fast" ]] && SKIP_INSTALL=true

# --- 1. sync code ------------------------------------------------------------
c "Syncing code → ${REMOTE}:${REMOTE_DIR}"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude '*.key' \
  --exclude .env \
  "$(dirname "$0")/" "${REMOTE}:${REMOTE_DIR}/"
ok "Code synced"

# --- 2. build + restart on the VM -------------------------------------------
c "Building on VM (install=$([[ $SKIP_INSTALL == true ]] && echo skip || echo yes))"
ssh "${SSH_OPTS[@]}" "$REMOTE" "bash -s" <<REMOTE_SCRIPT
set -e
cd "${REMOTE_DIR}"
if [ "${SKIP_INSTALL}" != "true" ]; then
  npm install --no-audit --no-fund
fi
npm run build
sudo systemctl restart ${SERVICE}
sleep 2
systemctl is-active ${SERVICE}
REMOTE_SCRIPT
ok "Built & service restarted"

# --- 3. health check ---------------------------------------------------------
c "Health check"
if ssh "${SSH_OPTS[@]}" "$REMOTE" "curl -fsS --max-time 8 http://localhost:${HEALTH_PORT}/api/health"; then
  echo
  ok "Deploy complete → https://game.fechtin.com/"
else
  echo
  printf "\033[1;31m✗ Health check failed. Run ./deploy.sh --logs to investigate.\033[0m\n"
  exit 1
fi
