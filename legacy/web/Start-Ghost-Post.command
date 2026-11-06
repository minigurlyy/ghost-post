#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is needed. Once installed, reopen this launcher."
  read -r -p "Press Return to close."
  exit 1
fi
node server.mjs --open
read -r -p "Press Return to close."
