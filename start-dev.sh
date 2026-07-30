#!/usr/bin/env bash

set -Eeuo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop is not running. Start it, then run this command again." >&2
  exit 1
fi

cd "$project_root"
docker compose up --build --remove-orphans
