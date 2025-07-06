#!/bin/bash
set -e

# Pour les couleurs (optionnel)
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACK_ENV="$SCRIPT_DIR/../.env" 

if grep -q "^FRONT_DIR=" "$BACK_ENV"; then
  FRONT_DIR=$(grep "^FRONT_DIR=" "$BACK_ENV" | cut -d= -f2-)
  read -p "Chemin du dossier FRONT [actuel: $FRONT_DIR]: " path
  FRONT_DIR=${path:-$FRONT_DIR}
else
  read -p "Chemin du dossier FRONT [par défaut: /home/upstra/infra-control_front]: " path
  FRONT_DIR=${path:-/home/upstra/infra-control_front}
fi

if grep -q "^FRONT_DIR=" "$BACK_ENV"; then
  sed -i "s|^FRONT_DIR=.*|FRONT_DIR=$FRONT_DIR|" "$BACK_ENV"
else
  echo "FRONT_DIR=$FRONT_DIR" >> "$BACK_ENV"
fi

FRONT_ENV="$FRONT_DIR/.env"

echo -e "${BLUE}📝 Configuration de l'environnement FRONT${NC}"

read -p "VITE_API_URL [http://localhost:3000]: " VITE_API_URL
VITE_API_URL=${VITE_API_URL:-http://localhost:3000}

read -p "VITE_WS_URL [http://localhost:3000]: " VITE_WS_URL
VITE_WS_URL=${VITE_WS_URL:-http://localhost:3000}

read -p "VITE_FRONT_PORT [4173]: " VITE_FRONT_PORT
VITE_FRONT_PORT=${VITE_FRONT_PORT:-4173}

if [ ! -d "$FRONT_DIR" ]; then
  echo -e "${RED}❌ Le dossier front '$FRONT_DIR' n'existe pas.${NC}"
  exit 1
fi

cat > "$FRONT_ENV" <<EOF
VITE_API_URL=$VITE_API_URL
VITE_WS_URL=$VITE_WS_URL
VITE_FRONT_PORT=$VITE_FRONT_PORT
EOF

echo -e "${GREEN}✅ Fichier $FRONT_ENV généré !${NC}"
