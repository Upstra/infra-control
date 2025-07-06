#!/bin/bash
source "$SCRIPT_DIR/scripts/config.sh"

backup() {
    echo -e "${BLUE}💾 Sauvegarde DB${NC}"
    mkdir -p backups; ts=$(date +%Y%m%d_%H%M%S)
    if use_local_db; then
        set -a; source "$ENV_FILE"; set +a
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USERNAME" "$DB_NAME" > backups/backup_$ts.sql
    else
        docker exec infra-control-postgres pg_dump -U "$DB_USERNAME" postgres > backups/backup_$ts.sql
    fi
    echo -e "${GREEN}✅ backups/backup_$ts.sql${NC}"
}

restore() {
    echo -e "${BLUE}📥 Restauration DB${NC}"; ls backups/*.sql || { echo "Aucune sauvegarde trouvée."; return; }
    select f in backups/*.sql; do [ -n "$f" ] && break; done
    if use_local_db; then
        set -a; source "$ENV_FILE"; set +a
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USERNAME" "$DB_NAME" < "$f"
    else
        docker exec -i infra-control-postgres psql -U "$DB_USERNAME" postgres < "$f"
    fi
    echo -e "${GREEN}✅ Restauration OK${NC}"
}