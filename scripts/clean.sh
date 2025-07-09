#!/bin/bash
source "$SCRIPT_DIR/scripts/config.sh"

echo -e "${RED}⚠️  Nettoyage Docker uniquement${NC}"
docker compose -f "$COMPOSE_APP" --env-file "$ENV_FILE" down -v
if use_monitoring; then
docker compose -f "$COMPOSE_MON" --env-file "$ENV_FILE" down -v
fi
echo -e "${GREEN}🧹 Tout est propre${NC}"