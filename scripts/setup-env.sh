#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/config.sh"

echo -e "${BLUE}🔧 Initialisation de l'environnement${NC}"

if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=upstradb
DB_USERNAME=upstra
DB_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=default
REDIS_TLS=true

JWT_SECRET=
JWT_REFRESH_SECRET=
SESSION_SECRET=
JWT_EXPIRATION=1h
JWT_2FA_TOKEN_EXPIRATION=5m
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000

RATE_LIMIT_GLOBAL_WINDOW_MS=900000
RATE_LIMIT_GLOBAL_MAX=1000

RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_STRICT_MAX=5
RATE_LIMIT_AUTH_MODERATE_MAX=10

RATE_LIMIT_SENSITIVE_WINDOW_MS=3600000
RATE_LIMIT_SENSITIVE_MAX=3

RATE_LIMIT_API_WINDOW_MS=300000
RATE_LIMIT_API_MAX=100

GITHUB_TOKEN=

FRONT_REPO=Upstra/infra-control_front
BACK_REPO=Upstra/infra-control

USE_LOCAL_DB=false
USE_MONITORING=true
EOF
  echo -e "${GREEN}Fichier $ENV_FILE créé (template complet)${NC}"
fi

read -p "Mot de passe PostgreSQL (vide → générer) : " dbpass
if [ -z "$dbpass" ]; then
  dbpass=$(openssl rand -base64 20)
  echo -e "${YELLOW}Généré : $dbpass${NC}"
fi
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$dbpass|" "$ENV_FILE"

read -p "Mot de passe Redis (vide → générer) : " redispass
if [ -z "$redispass" ]; then
  redispass=$(openssl rand -base64 20)
  echo -e "${YELLOW}Généré : $redispass${NC}"
fi
sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$redispass|" "$ENV_FILE"

read -p "GitHub Token (pat_xxx…) : " github_token
sed -i "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=$github_token|" "$ENV_FILE"

read -p "Frontend URL [http://localhost:5173] : " frontend_url
[ -n "$frontend_url" ] && sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$frontend_url|" "$ENV_FILE"

read -p "Backend URL [http://localhost:3000] : " backend_url
[ -n "$backend_url" ] && sed -i "s|^BACKEND_URL=.*|BACKEND_URL=$backend_url|" "$ENV_FILE"

if ! grep -q '^JWT_SECRET=' "$ENV_FILE" || grep -q '^JWT_SECRET=$' "$ENV_FILE"; then
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(rand_hex)|" "$ENV_FILE"
fi
if ! grep -q '^JWT_REFRESH_SECRET=' "$ENV_FILE" || grep -q '^JWT_REFRESH_SECRET=$' "$ENV_FILE"; then
  sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(rand_hex)|" "$ENV_FILE"
fi
if ! grep -q '^SESSION_SECRET=' "$ENV_FILE" || grep -q '^SESSION_SECRET=$' "$ENV_FILE"; then
  sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$(rand_hex)|" "$ENV_FILE"
fi

read -p "Utiliser Postgres/Redis EN LOCAL ? (oui/non) : " ans
if [[ "$ans" =~ ^[Oo]ui$ ]]; then
  sed -i 's/^USE_LOCAL_DB=.*/USE_LOCAL_DB=true/' "$ENV_FILE"

  read -p "Installer PostgreSQL localement ? (oui/non) : " install_pg
  if [[ "$install_pg" =~ ^[Oo]ui$ ]]; then
    echo -e "${YELLOW}Installation PostgreSQL + uuid-ossp...${NC}"
    sudo dnf install -y postgresql-server postgresql-contrib
    sudo postgresql-setup --initdb
    sudo systemctl enable --now postgresql

    sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    echo -e "${GREEN}✅ PostgreSQL installé et uuid-ossp activée${NC}"
  fi

  read -p "Installer Redis localement ? (oui/non) : " install_redis
  if [[ "$install_redis" =~ ^[Oo]ui$ ]]; then
    echo -e "${YELLOW}Installation Redis...${NC}"
    sudo dnf install -y redis
    sudo systemctl enable --now redis
    echo -e "${GREEN}✅ Redis installé${NC}"
  fi

else
  sed -i 's/^USE_LOCAL_DB=.*/USE_LOCAL_DB=false/' "$ENV_FILE"
fi

read -p "Démarrer Monitoring (Prometheus + Grafana) ? (oui/non) : " mon
if [[ "$mon" =~ ^[Oo]ui$ ]]; then
  sed -i 's/^USE_MONITORING=.*/USE_MONITORING=true/' "$ENV_FILE"
else
  sed -i 's/^USE_MONITORING=.*/USE_MONITORING=false/' "$ENV_FILE"
fi

echo -e "${GREEN}✔ setup-env terminé — vérifiez $ENV_FILE${NC}"
