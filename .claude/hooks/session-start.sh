#!/bin/bash
# Bereitet eine Claude-Code-Cloud-Sitzung vor: Abhängigkeiten installieren und
# Umgebungsvariablen für E2E-Tests mit dem vorinstallierten Chromium setzen.
# Läuft synchron und nur in Cloud-Sitzungen; lokal passiert nichts.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# pnpm-Version kommt aus package.json (packageManager); Rückfall über corepack.
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable pnpm >&2
fi

# Ausgabe nach stderr, damit sie nicht in den Kontext der Sitzung gelangt.
pnpm install >&2

# E2E in der Cloud: nur das vorinstallierte Chromium; WebKit läuft in GitHub Actions.
# „playwright install" darf hier nicht laufen.
if [ -n "${CLAUDE_ENV_FILE:-}" ] && [ -x /opt/pw-browsers/chromium ]; then
  {
    echo 'export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium'
    echo 'export E2E_ENGINES=chromium'
  } >> "$CLAUDE_ENV_FILE"
fi

echo "Sitzung vorbereitet: Abhängigkeiten installiert (pnpm). E2E: pnpm build, dann pnpm test:e2e (Chromium)."
