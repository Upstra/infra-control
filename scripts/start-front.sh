#!/bin/bash
set -e

RED='\033[0;31m';   GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONT_DIR="${FRONT_DIR:-/home/upstra/infra-control_front}"
FRONT_ENV="$FRONT_DIR/.env"

start() {
  if [ ! -f "$FRONT_ENV" ]; then
    echo -e "${RED}❌ $FRONT_ENV introuvable. Lance d'abord './infra setup-env'${NC}"
    exit 1
  fi

  export $(grep -v '^#' "$FRONT_ENV" | xargs)
  PORT="${VITE_FRONT_PORT:-4173}"

  cd "$FRONT_DIR"
  if command -v pnpm >/dev/null; then
    pnpm install
    pnpm run build
  else
    npm install
    npm run build
  fi

  if ! command -v serve >/dev/null; then
    echo -e "${YELLOW}⏳ Installation de serve...${NC}"
    npm install -g serve
  fi

  echo -e "${GREEN}🚀 Serveur front prod sur http://localhost:$PORT${NC}"
  serve -s dist -l $PORT
}

stop() {
  pid=$(pgrep -f "serve -s dist")
  if [ -n "$pid" ]; then
    kill $pid
    echo -e "${GREEN}🛑 Serveur front arrêté (PID $pid)${NC}"
  else
    echo -e "${YELLOW}Aucun serveur front 'serve' trouvé${NC}"
  fi
}

status() {
  pid=$(pgrep -f "serve -s dist")
  if [ -n "$pid" ]; then
    echo -e "${GREEN}Serveur front actif (PID $pid)${NC}"
  else
    echo -e "${RED}Serveur front non démarré${NC}"
  fi
}

logs() {
  echo -e "${YELLOW}Pas de gestion de logs front en mode 'serve'. Utilise pm2 ou redirige la sortie si tu veux des logs persistants.${NC}"
}

case "$1" in
  start)  start ;;
  stop)   stop ;;
  status) status ;;
  logs)   logs ;;
  *)
    echo "Usage: $0 {start|stop|status|logs}"
    exit 1
    ;;
esac
