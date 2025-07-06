# Dans setup-env.sh (le chef d’orchestre)
#!/bin/bash
set -e

source "$(dirname "${BASH_SOURCE[0]}")/config.sh"
source "$(dirname "${BASH_SOURCE[0]}")/setup-env-back.sh"
source "$(dirname "${BASH_SOURCE[0]}")/setup-env-front.sh"

echo -e "${GREEN}✔ setup-env global terminé !${NC}"
