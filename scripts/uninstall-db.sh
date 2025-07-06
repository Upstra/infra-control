#!/bin/bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${YELLOW}🔧 Arrêt et désactivation des services PostgreSQL et Redis…${NC}"

if systemctl is-active --quiet postgresql; then
  sudo systemctl stop postgresql
  echo -e "${GREEN}→ postgresql arrêté${NC}"
fi
if systemctl is-enabled --quiet postgresql; then
  sudo systemctl disable postgresql
  echo -e "${GREEN}→ postgresql désactivé${NC}"
fi

if systemctl is-active --quiet redis; then
  sudo systemctl stop redis
  echo -e "${GREEN}→ redis arrêté${NC}"
fi
if systemctl is-enabled --quiet redis; then
  sudo systemctl disable redis
  echo -e "${GREEN}→ redis désactivé${NC}"
fi

echo -e "${YELLOW}❌ Désinstallation des paquets…${NC}"
sudo dnf remove -y postgresql-server postgresql-contrib redis || true
echo -e "${GREEN}→ Paquets supprimés${NC}"

echo -e "${YELLOW}🗑️ Suppression des données…${NC}"
sudo rm -rf /var/lib/pgsql /var/lib/pgsql/data /var/lib/redis /var/lib/redis/data
echo -e "${GREEN}→ Répertoires de données PostgreSQL et Redis supprimés${NC}"

echo -e "${GREEN}✅ PostgreSQL et Redis ont été complètement désinstallés.${NC}"
