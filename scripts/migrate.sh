#!/bin/bash
source "$SCRIPT_DIR/scripts/config.sh"

echo -e "${BLUE}🔄 Migrations DB${NC}"
if use_local_db; then
    set -a; source "$ENV_FILE"; set +a
    pnpm run migration:run
else
    docker exec infra-control-backend pnpm migration:run
fi
echo -e "${GREEN}✅ Migrations OK${NC}"