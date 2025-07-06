#!/bin/bash

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# Detect .env file
echo
if [ -f ".env.rasp" ] && grep -q "Raspberry Pi" "/proc/device-tree/model" 2>/dev/null; then
    ENV_FILE=".env.rasp"
    echo -e "${BLUE}🍓 Raspberry Pi détecté - Utilisation de .env.rasp${NC}"
elif [ -f ".env.prod" ]; then
    ENV_FILE=".env.prod"
    echo -e "${BLUE}🚀 Mode production - Utilisation de .env.prod${NC}"
else
    ENV_FILE=".env"
    echo -e "${YELLOW}⚠️  Mode développement - Utilisation de .env${NC}"
fi

COMPOSE_APP="docker-compose.prod.yml"
COMPOSE_MON="docker-compose.monitoring.yml"

check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}❌ Fichier $ENV_FILE non trouvé!${NC}"
        echo "→ Lance './infra setup-env'"
        exit 1
    fi
}

show_help() {
    cat <<EOF
Usage: ./infra [command]

Commands:
  setup-env     - Initialise .env, demande DB/Redis passwords, génère secrets, flags USE_LOCAL_DB et USE_MONITORING
  deploy/start/stop/restart/status/logs
                - Gestion Docker ou local selon flag
  backup/restore
                - Sauvegarde et restauration DB
  migrate       - Migrations DB
  clean         - Nettoyage Docker uniquement
  help          - Affiche cette aide
EOF
}

rand_hex() { openssl rand -hex 32; }

# Flags helpers
use_local_db()    { grep -q '^USE_LOCAL_DB=true' "$ENV_FILE"; }
use_monitoring()  { grep -q '^USE_MONITORING=true' "$ENV_FILE"; }