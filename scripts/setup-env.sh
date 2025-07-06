#!/bin/bash
set -e

source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

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
REDIS_TLS=

JWT_SECRET=
JWT_REFRESH_SECRET=
SESSION_SECRET=
JWT_EXPIRATION=1h
JWT_2FA_TOKEN_EXPIRATION=5m
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080

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

USE_LOCAL_DB=true
USE_MONITORING=false
EOF
  echo -e "${GREEN}Fichier $ENV_FILE créé (template)${NC}"
fi

set -a
source "$ENV_FILE"
set +a

read -p "Mot de passe PostgreSQL (vide→générer) : " dbpass
if [ -z "$dbpass" ]; then
  dbpass=$(openssl rand -base64 20)
  echo -e "${YELLOW}Généré : $dbpass${NC}"
fi
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$dbpass|" "$ENV_FILE"

read -p "Mot de passe Redis (vide→générer) : " redispass
if [ -z "$redispass" ]; then
  redispass=$(openssl rand -base64 20)
  echo -e "${YELLOW}Généré : $redispass${NC}"
fi
sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$redispass|" "$ENV_FILE"

read -p "GitHub Token (pat_xxx…) : " tok && sed -i "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=$tok|" "$ENV_FILE"
read -p "Frontend URL [http://localhost:5173] : " fu && [ -n "$fu" ] && sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=$fu|" "$ENV_FILE"
read -p "Backend URL  [http://localhost:8080] : " bu && [ -n "$bu" ] && sed -i "s|^BACKEND_URL=.*|BACKEND_URL=$bu|" "$ENV_FILE"

grep -q '^JWT_SECRET=' "$ENV_FILE" && grep -q '^JWT_SECRET=$' "$ENV_FILE" \
  && sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(rand_hex)|" "$ENV_FILE"
grep -q '^JWT_REFRESH_SECRET=' "$ENV_FILE" && grep -q '^JWT_REFRESH_SECRET=$' "$ENV_FILE" \
  && sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(rand_hex)|" "$ENV_FILE"
grep -q '^SESSION_SECRET=' "$ENV_FILE" && grep -q '^SESSION_SECRET=$' "$ENV_FILE" \
  && sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$(rand_hex)|" "$ENV_FILE"

read -p "Utiliser Postgres/Redis EN LOCAL ? (y/n) : " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  sed -i 's/^USE_LOCAL_DB=.*/USE_LOCAL_DB=true/' "$ENV_FILE"

  read -p "→ Installer PostgreSQL + uuid-ossp localement ? (y/n) : " ipg
  if [[ "$ipg" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation PostgreSQL…${NC}"

    sudo dnf install -y postgresql-server postgresql-contrib
    sudo postgresql-setup --initdb
    sudo systemctl enable --now postgresql

    PGDATA=$(sudo -u postgres psql -tAc "show data_directory;" | xargs)

    if ! grep -q '^local *all *postgres *peer' "$PGDATA/pg_hba.conf"; then
      sudo sed -i '1ilocal   all             postgres                                peer' "$PGDATA/pg_hba.conf"
    fi

    sudo sed -i "s/^\(local.*all.*all.*\)peer/\1md5/" "$PGDATA/pg_hba.conf"
    sudo sed -i "s/^\(host.*all.*all.*127.0.0.1\/32.*\)ident/\1md5/" "$PGDATA/pg_hba.conf"
    sudo sed -i "s/^\(host.*all.*all.*::1\/128.*\)ident/\1md5/" "$PGDATA/pg_hba.conf"
    
    if ! grep -q "$DB_USERNAME" "$PGDATA/pg_hba.conf"; then
      echo "host    all    $DB_USERNAME    127.0.0.1/32    md5" | sudo tee -a "$PGDATA/pg_hba.conf"
    fi
    sudo systemctl restart postgresql
    sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USERNAME'" | grep -q 1 || \
      sudo -u postgres psql -c "CREATE USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
      sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USERNAME ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE=template0;"
    sudo -u postgres psql -c "ALTER USER $DB_USERNAME WITH SUPERUSER;"
    sudo -u postgres psql -c "ALTER USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD';"

    echo -e "${GREEN}✅ PostgreSQL + uuid-ossp OK${NC}"
  fi
  read -p "→ Installer Redis localement ? (y/n) : " ir
  if [[ "$ir" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation Redis…${NC}"
    sudo dnf install -y redis
    sudo systemctl enable --now redis
    echo -e "${GREEN}✅ Redis OK${NC}"
  fi

else
  sed -i 's/^USE_LOCAL_DB=.*/USE_LOCAL_DB=false/' "$ENV_FILE"
fi

read -p "Démarrer Monitoring (Prometheus + Grafana) ? (y/n) : " mon
if [[ "$mon" =~ ^[Yy]$ ]]; then
  sed -i 's/^USE_MONITORING=.*/USE_MONITORING=true/' "$ENV_FILE"
else
  sed -i 's/^USE_MONITORING=.*/USE_MONITORING=false/' "$ENV_FILE"
fi

echo -e "${GREEN}✔ setup-env terminé — vérifiez $ENV_FILE${NC}"
