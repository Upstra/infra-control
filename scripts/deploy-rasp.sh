#!/bin/bash

# Script de déploiement pour Raspberry Pi
# Usage: ./scripts/deploy-rasp.sh

echo "🚀 Déploiement Infra Control sur Raspberry Pi"
echo "==========================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé!${NC}"
    echo "Installez Docker avec: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Vérifier que docker-compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé!${NC}"
    echo "Installez Docker Compose"
    exit 1
fi

# Créer les dossiers nécessaires
echo -e "${YELLOW}📁 Création des dossiers...${NC}"
mkdir -p backups logs

# Charger les variables d'environnement
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Fichier .env.prod non trouvé!${NC}"
    exit 1
fi

# Export des variables pour docker-compose
export $(cat .env.prod | grep -v '^#' | xargs)

echo -e "${YELLOW}📦 Construction de l'image Docker...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod build

echo -e "${YELLOW}🚀 Démarrage de PostgreSQL et Redis...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres redis

# Attendre que PostgreSQL soit prêt
echo -e "${YELLOW}⏳ Attente du démarrage de PostgreSQL...${NC}"
sleep 10

# Vérifier si une backup existe
if ls backups/*.sql 1> /dev/null 2>&1; then
    echo -e "${YELLOW}📥 Restauration de la base de données depuis la backup...${NC}"
    
    # Trouver la dernière backup
    LATEST_BACKUP=$(ls -t backups/*.sql | head -1)
    echo "Utilisation de: $LATEST_BACKUP"
    
    # Restaurer la backup
    docker exec -i infra-control-postgres psql -U postgres postgres < "$LATEST_BACKUP"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Base de données restaurée!${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la restauration!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Aucune backup trouvée, démarrage avec une base vierge${NC}"
fi

echo -e "${YELLOW}🚀 Démarrage du backend et des services de monitoring...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

echo -e "${YELLOW}⏳ Attente du démarrage complet (30s)...${NC}"
sleep 30

# Vérifier l'état
echo -e "${YELLOW}🔍 Vérification de l'état des services...${NC}"
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

# Test de santé
if curl -s http://localhost:8080/health/simple > /dev/null; then
    echo -e "${GREEN}✅ Backend opérationnel!${NC}"
else
    echo -e "${RED}❌ Le backend ne répond pas!${NC}"
    echo "Vérifiez les logs: docker-compose -f docker-compose.prod.yml --env-file .env.prod logs backend"
fi

echo -e "${GREEN}✨ Déploiement terminé!${NC}"
echo ""
echo "📌 Accès aux services:"
echo "   - API Backend: http://$(hostname -I | awk '{print $1}'):8080"
echo "   - Swagger: http://$(hostname -I | awk '{print $1}'):8080/docs"
echo "   - Prometheus: http://$(hostname -I | awk '{print $1}'):9090"
echo "   - Grafana: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "📌 Commandes utiles:"
echo "   - Logs: docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f"
echo "   - Stop: docker-compose -f docker-compose.prod.yml --env-file .env.prod down"