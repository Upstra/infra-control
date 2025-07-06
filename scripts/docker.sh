#!/bin/bash
source "$SCRIPT_DIR/scripts/config.sh"

deploy() {
    check_env; mkdir -p backups logs
    if use_local_db; then
        echo -e "${YELLOW}DB/Redis local → Docker ne lancera que backend/monitoring${NC}"
    else
        docker compose -f "$COMPOSE_APP" --env-file "$ENV_FILE" build
        docker compose -f "$COMPOSE_APP" --env-file "$ENV_FILE" up -d postgres redis
    fi
    if use_local_db; then start_backend_local; else docker compose -f "$COMPOSE_APP" --env-file "$ENV_FILE" up -d backend; fi
    if use_monitoring; then docker compose -f "$COMPOSE_MON" --env-file "$ENV_FILE" up -d && echo -e "${GREEN}Monitoring lancé${NC}"; fi
    echo -e "${GREEN}✨ Déploiement terminé${NC}"
}

start() { check_env; [use compose or local] }
stop()  { [same] }
restart(){ stop; start }
status(){ [same] }
logs(){ [same] }