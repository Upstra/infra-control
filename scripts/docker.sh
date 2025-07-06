#!/bin/bash
set -e

source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

deploy() {
  mkdir -p "$SCRIPT_DIR/backups" "$SCRIPT_DIR/logs"

  if use_local_db; then
    echo -e "${YELLOW}DB/Redis en local → Docker ne lancera que backend/monitoring${NC}"
  else
    echo -e "${GREEN}Lancement de Postgres+Redis via Docker…${NC}"
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" build
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d postgres redis
  fi

  if use_local_db; then
    start_backend_local
  else
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d backend
  fi

  if use_monitoring; then
    docker-compose -f docker-compose.monitoring.yml --env-file "$ENV_FILE" up -d
    echo -e "${GREEN}Monitoring lancé${NC}"
  else
    echo -e "${YELLOW}Monitoring non lancé${NC}"
  fi

  echo -e "${GREEN}✨ Déploiement terminé${NC}"
}

start() {
  if use_local_db; then
    start_backend_local
  else
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d postgres redis backend
  fi
  if use_monitoring; then
    docker-compose -f docker-compose.monitoring.yml --env-file "$ENV_FILE" up -d
  fi
  echo -e "${GREEN}🚦 Services démarrés${NC}"
}

stop() {
  if use_local_db; then
    stop_backend_local
  else
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" down --remove-orphans
  fi
  if use_monitoring; then
    docker-compose -f docker-compose.monitoring.yml --env-file "$ENV_FILE" down --remove-orphans
  fi
  echo -e "${GREEN}🛑 Services arrêtés${NC}"
}

status() {
  echo -e "${BLUE}📊 APP :${NC}"
  if use_local_db; then echo "(Local)"; else docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" ps; fi
  echo -e "${BLUE}📊 MONITORING :${NC}"
  if use_monitoring; then docker-compose -f docker-compose.monitoring.yml --env-file "$ENV_FILE" ps; else echo "(Désactivé)"; fi
}

logs() {
  if use_local_db; then
    tail -f "$SCRIPT_DIR/logs/backend.log"
  else
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" logs -f --tail=50 backend
  fi
  if use_monitoring; then
    docker-compose -f docker-compose.monitoring.yml --env-file "$ENV_FILE" logs -f --tail=50
  fi
}
