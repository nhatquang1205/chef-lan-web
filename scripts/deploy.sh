#!/usr/bin/env bash
# Runs on the VPS, piped in over ssh by .github/workflows/deploy.yml.
# Also fine to run by hand on the VPS: bash scripts/deploy.sh [https://your.host]
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/chef-lan-web}"
SERVICE="${SERVICE:-cheflan-web}"
PORT="${PORT:-3100}"
APP_URL="${1:-}"

cd "$APP_DIR"

# NEXT_PUBLIC_API_BASE_URL is inlined into the browser bundle AT BUILD TIME, so it has to be
# present on this machine before `next build`, not just before the service starts.
if [ ! -f .env.production ]; then
  echo "✗ $APP_DIR/.env.production is missing. Create it (see deploy/README.md) with" >&2
  echo "  API_BASE_URL and NEXT_PUBLIC_API_BASE_URL, then re-run." >&2
  exit 1
fi

echo "→ fetching"
git fetch origin main
# Hard reset rather than pull: the working tree should match the commit CI just tested, with
# no merge to go wrong. .env.production is gitignored, so it survives.
git reset --hard origin/main

# corepack ships with Node and reads the pinned pnpm version from package.json.
PNPM="corepack pnpm"

echo "→ installing"
$PNPM install --frozen-lockfile

echo "→ building"
NEXT_TELEMETRY_DISABLED=1 $PNPM build

echo "→ restarting"
sudo systemctl restart "$SERVICE"

# Check the local port when no public URL is given (or DNS is not set up yet); otherwise the
# public URL, which also proves nginx is routing to us.
CHECK_URL="${APP_URL:-http://127.0.0.1:$PORT}"

echo "→ health check ($CHECK_URL)"
code=""
for _ in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$CHECK_URL/" || true)
  if [ "$code" = "200" ]; then
    echo "   $CHECK_URL/ → 200"
    exit 0
  fi
  sleep 2
done

echo "   never came back healthy (last status: ${code:-none})" >&2
sudo systemctl status "$SERVICE" --no-pager --lines=30 >&2 || true
exit 1
