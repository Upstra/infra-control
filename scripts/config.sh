#!/bin/bash
set -e

RED='\033[0;31m';   GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$SCRIPT_DIR/.env.rasp" ] && grep -q "Raspberry Pi" "/proc/device-tree/model" 2>/dev/null; then
  ENV_FILE="$SCRIPT_DIR/.env.rasp"
  echo -e "${BLUE}🍓 Raspberry Pi détecté – .env.rasp${NC}"
elif [ -f "$SCRIPT_DIR/.env.prod" ]; then
  ENV_FILE="$SCRIPT_DIR/.env.prod"
  echo -e "${BLUE}🚀 Mode production – .env.prod${NC}"
else
  ENV_FILE="$SCRIPT_DIR/.env"
  echo -e "${YELLOW}⚠️  Mode développement – .env${NC}"
fi

COMPOSE_APP="docker-compose.prod.yml"
COMPOSE_MON="docker-compose.monitoring.yml"

rand_hex() { openssl rand -hex 32; }

use_local_db()   { grep -q '^USE_LOCAL_DB=true'   "$ENV_FILE"; }
use_monitoring() { grep -q '^USE_MONITORING=true' "$ENV_FILE"; }

check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ $ENV_FILE introuvable, lancez './infra setup-env'${NC}"
    exit 1
  fi
}

show_help() {
  cat <<EOF
Usage: ./infra <commande>

  setup-env     Initialise le .env (création + prompts)
  deploy        Déploie backend (+ monitoring) selon USE_LOCAL_DB
  start/stop/... Gère Docker ou backend local selon USE_LOCAL_DB
  backup/restore Sauvegarde / restauration DB (local ou Docker)
  migrate       Lance les migrations (local ou Docker)
  clean         Nettoie les containers Docker
  uninstall-db  Désinstalle PostgreSQL et Redis (local)
  help          Cette aide
EOF
}

start_backend_local() {
  echo -e "${BLUE}▶️  Démarrage du backend EN LOCAL…${NC}"
  if command -v node >/dev/null; then
    ver=$(node -v|cut -dv -f2)
    maj=${ver%%.*}; min=$(echo $ver|cut -d. -f2)
  else
    maj=0; min=0
  fi
  if (( maj<18 || (maj==18 && min<12) )); then
    echo -e "${YELLOW}Installation Node.js v18…${NC}"
    sudo dnf module reset nodejs -y
    sudo dnf module enable nodejs:18 -y
    sudo dnf install -y nodejs npm
  fi
  command -v pnpm >/dev/null 2>&1 || { echo -e "${YELLOW}Installation pnpm…${NC}"; npm install -g pnpm; }
  cd "$SCRIPT_DIR"
  pnpm install && pnpm run build

  date=$(date +%Y%m%d_%H%M%S)
  logs_dir="$SCRIPT_DIR/logs"
  log_name="backend_$date.log"

  mkdir -p "$logs_dir"
  nohup pnpm run start:prod > "$logs_dir/$log_name" 2>&1 & echo $! > "$SCRIPT_DIR/backend.pid"
  echo -e "${GREEN}Backend local lancé (PID $(cat backend.pid))${NC}"
}

stop_backend_local() {
  if [ -f "$SCRIPT_DIR/backend.pid" ]; then
    kill "$(cat "$SCRIPT_DIR/backend.pid")" && rm "$SCRIPT_DIR/backend.pid"
    echo -e "${GREEN}Backend local arrêté${NC}"
  fi
}
