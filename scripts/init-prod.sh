#!/bin/bash

echo "🚀 Script d'initialisation pour la première mise en production"
echo "============================================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier si le fichier .env.prod existe
if [ ! -f .env.prod ]; then
    echo -e "${YELLOW}📝 Création du fichier .env.prod à partir du template...${NC}"
    cp .env.prod.example .env.prod
    echo -e "${RED}⚠️  IMPORTANT: Modifiez .env.prod avec vos valeurs de production!${NC}"
    echo "   Éditez le fichier et relancez ce script."
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env.prod | grep -v '^#' | xargs)

echo -e "${BLUE}📋 Configuration détectée:${NC}"
echo "   Base de données: $DB_NAME"
echo "   Utilisateur DB: $DB_USERNAME"
echo "   Port DB: $DB_PORT"
echo "   Port Redis: $REDIS_PORT"
echo ""

echo -e "${YELLOW}⚠️  ATTENTION: Ce script va initialiser l'infrastructure de production!${NC}"
echo "   Cela inclut:"
echo "   - Démarrage de PostgreSQL, Redis et du backend"
echo "   - Création de la base de données"
echo "   - Exécution des migrations initiales"
echo ""
read -p "Continuer? (y/n): " ir

if [ "$confirm" =~ ^[Yy]$ ]; then
    echo -e "${RED}❌ Initialisation annulée${NC}"
    exit 1
fi

# Créer les dossiers nécessaires
echo -e "\n${YELLOW}📁 Création des dossiers...${NC}"
mkdir -p backups
mkdir -p logs

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}🛑 Arrêt des services existants...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

echo -e "\n${YELLOW}❓ Est-ce une installation complètement nouvelle?${NC}"
echo "   (Répondre 'oui' supprimera toutes les données existantes!)"
read -p "Nouvelle installation? (y/n): " new_install

if [ "$new_install" =~ ^[Yy]$ ]; then
    echo -e "${YELLOW}🗑️  Suppression des volumes existants...${NC}"
    docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
    docker volume rm infra-control_postgres-data 2>/dev/null || true
    docker volume rm infra-control_redis-data 2>/dev/null || true
    docker volume rm infra-control_prometheus-data 2>/dev/null || true
    docker volume rm infra-control_grafana-data 2>/dev/null || true
fi

# Construire les images
echo -e "\n${YELLOW}🔨 Construction des images Docker...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Démarrer uniquement PostgreSQL et Redis d'abord
echo -e "\n${YELLOW}🚀 Démarrage de PostgreSQL et Redis...${NC}"
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Attendre que PostgreSQL soit prêt
echo -e "\n${YELLOW}⏳ Attente du démarrage de PostgreSQL...${NC}"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U $DB_USERNAME > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL est prêt!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "\n${RED}❌ PostgreSQL n'a pas démarré dans le temps imparti!${NC}"
    echo "Vérifiez les logs: docker-compose -f docker-compose.prod.yml logs postgres"
    exit 1
fi

# Attendre que Redis soit prêt
echo -e "\n${YELLOW}⏳ Attente du démarrage de Redis...${NC}"
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a $REDIS_PASSWORD ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis est prêt!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "\n${RED}❌ Redis n'a pas démarré dans le temps imparti!${NC}"
    echo "Vérifiez les logs: docker-compose -f docker-compose.prod.yml logs redis"
    exit 1
fi

# Démarrer le backend (qui exécutera automatiquement les migrations)
echo -e "\n${YELLOW}🚀 Démarrage du backend avec migrations...${NC}"
docker-compose -f docker-compose.prod.yml up -d backend

# Attendre que le backend soit prêt
echo -e "\n${YELLOW}⏳ Attente du démarrage du backend...${NC}"
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend est prêt!${NC}"
        break
    fi
    echo -n "."
    sleep 3
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "\n${RED}❌ Le backend n'a pas démarré correctement!${NC}"
    echo "Vérifiez les logs: docker-compose -f docker-compose.prod.yml logs backend"
    exit 1
fi

# Démarrer les services de monitoring
echo -e "\n${YELLOW}📊 Démarrage des services de monitoring...${NC}"
docker-compose -f docker-compose.prod.yml up -d prometheus grafana node-exporter

# Vérifier l'état final
echo -e "\n${YELLOW}🔍 Vérification de l'état des services...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Créer une sauvegarde initiale
echo -e "\n${YELLOW}📦 Création d'une sauvegarde initiale...${NC}"
backup_date=$(date +%Y%m%d_%H%M%S)
backup_dir="backups/initial_$backup_date"
mkdir -p $backup_dir

docker exec infra-control-postgres pg_dump -U $DB_USERNAME $DB_NAME > $backup_dir/database_initial.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sauvegarde initiale créée: $backup_dir/database_initial.sql${NC}"
else
    echo -e "${YELLOW}⚠️  La sauvegarde a échoué (normal si la base est vide)${NC}"
fi

# Afficher les informations d'accès
echo -e "\n${GREEN}✨ Installation terminée avec succès!${NC}"
echo ""
echo -e "${BLUE}📌 Accès aux services:${NC}"
echo "   - API Backend: http://localhost:8080"
echo "   - Documentation Swagger: http://localhost:8080/docs"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3001 (admin/admin par défaut)"
echo ""
echo -e "${BLUE}📌 Prochaines étapes:${NC}"
echo "   1. Configurez l'utilisateur admin via l'endpoint /setup"
echo "   2. Changez le mot de passe Grafana"
echo "   3. Configurez vos sauvegardes automatiques"
echo ""
echo -e "${BLUE}📌 Commandes utiles:${NC}"
echo "   - Voir les logs: ./infra logs"
echo "   - Vérifier l'état: ./infra status"
echo "   - Gérer les migrations: ./scripts/migrate-prod.sh"
echo "   - Arrêter tout: ./infra stop"