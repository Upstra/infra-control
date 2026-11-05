#!/bin/sh
set -e

if [ -z "$1" ]; then
  echo "Usage: pnpm migration:generate <MigrationName>" >&2
  exit 1
fi

npx ts-node -r dotenv/config -r tsconfig-paths/register ./node_modules/typeorm/cli.js \
  -d src/core/config/data-source.ts \
  migration:generate "src/core/migrations/$1"
