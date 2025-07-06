#!/bin/bash

echo "🚀 Script de migration pour la production"
echo "========================================"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si le fichier .env.prod existe
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Fichier .env.prod non trouvé!${NC}"
    echo "   Créez d'abord votre fichier .env.prod basé sur .env.prod.example"
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env.prod | grep -v '^#' | xargs)

# Fonction pour vérifier l'état du conteneur
check_container_status() {
    local container_name=$1
    if docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*Up"; then
        return 0
    else
        return 1
    fi
}

# Fonction pour exécuter des commandes dans le conteneur backend
exec_in_backend() {
    docker exec infra-control-backend "$@"
}

echo -e "${YELLOW}📋 Vérification de l'infrastructure...${NC}"

# Vérifier que l'infrastructure est en cours d'exécution
if ! check_container_status "infra-control-backend"; then
    echo -e "${RED}❌ Le conteneur backend n'est pas en cours d'exécution!${NC}"
    echo "   Démarrez d'abord l'infrastructure avec: ./infra start"
    exit 1
fi

if ! check_container_status "infra-control-postgres"; then
    echo -e "${RED}❌ Le conteneur PostgreSQL n'est pas en cours d'exécution!${NC}"
    echo "   Démarrez d'abord l'infrastructure avec: ./infra start"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure en cours d'exécution${NC}"
echo ""

# Menu principal
echo "Que souhaitez-vous faire ?"
echo "1) Vérifier l'état des migrations"
echo "2) Exécuter les migrations en attente"
echo "3) Créer une sauvegarde avant migration"
echo "4) Revenir à la migration précédente (rollback)"
echo "5) Afficher l'historique des migrations"
echo ""
read -p "Votre choix (1-5): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}🔍 Vérification de l'état des migrations...${NC}"
        exec_in_backend pnpm typeorm migration:show -d dist/src/core/config/data-source.js
        ;;
    
    2)
        echo -e "\n${YELLOW}⚠️  ATTENTION: Vous êtes sur le point d'exécuter les migrations en production!${NC}"
        read -p "Êtes-vous sûr de vouloir continuer? (y/n): " confirm
        
        if [ "$confirm" =~ ^[Yy]$ ]; then
            echo -e "\n${YELLOW}🔄 Exécution des migrations...${NC}"
            
            # Créer une sauvegarde automatique
            echo -e "${YELLOW}📦 Création d'une sauvegarde automatique...${NC}"
            backup_date=$(date +%Y%m%d_%H%M%S)
            backup_dir="backups/auto_migration_$backup_date"
            mkdir -p $backup_dir
            
            docker exec infra-control-postgres pg_dump -U $DB_USERNAME $DB_NAME > $backup_dir/database_backup.sql
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Sauvegarde créée: $backup_dir/database_backup.sql${NC}"
            else
                echo -e "${RED}❌ Échec de la sauvegarde!${NC}"
                exit 1
            fi
            
            # Exécuter les migrations
            echo -e "\n${YELLOW}🚀 Exécution des migrations...${NC}"
            exec_in_backend pnpm migration:run
            
            if [ $? -eq 0 ]; then
                echo -e "\n${GREEN}✅ Migrations exécutées avec succès!${NC}"
                
                # Afficher l'état final
                echo -e "\n${YELLOW}📊 État final des migrations:${NC}"
                exec_in_backend pnpm typeorm migration:show -d dist/src/core/config/data-source.js
            else
                echo -e "\n${RED}❌ Échec des migrations!${NC}"
                echo -e "${YELLOW}💡 Pour restaurer la base de données:${NC}"
                echo "   docker exec -i infra-control-postgres psql -U $DB_USERNAME $DB_NAME < $backup_dir/database_backup.sql"
                exit 1
            fi
        else
            echo -e "${YELLOW}❌ Migration annulée${NC}"
        fi
        ;;
    
    3)
        echo -e "\n${YELLOW}📦 Création d'une sauvegarde manuelle...${NC}"
        backup_date=$(date +%Y%m%d_%H%M%S)
        backup_dir="backups/manual_$backup_date"
        mkdir -p $backup_dir
        
        # Sauvegarde de la base de données
        echo "Sauvegarde de PostgreSQL..."
        docker exec infra-control-postgres pg_dump -U $DB_USERNAME $DB_NAME > $backup_dir/database_backup.sql
        
        # Sauvegarde des volumes Docker
        echo "Sauvegarde des volumes Docker..."
        docker run --rm -v infra-control_postgres-data:/data -v $(pwd)/$backup_dir:/backup alpine tar czf /backup/postgres-data.tar.gz -C /data .
        docker run --rm -v infra-control_redis-data:/data -v $(pwd)/$backup_dir:/backup alpine tar czf /backup/redis-data.tar.gz -C /data .
        
        echo -e "${GREEN}✅ Sauvegarde complète créée dans: $backup_dir${NC}"
        echo "   - database_backup.sql : Dump SQL de la base"
        echo "   - postgres-data.tar.gz : Volume PostgreSQL"
        echo "   - redis-data.tar.gz : Volume Redis"
        ;;
    
    4)
        echo -e "\n${YELLOW}⚠️  ATTENTION: Rollback de migration!${NC}"
        echo "Cette opération va annuler la dernière migration exécutée."
        read -p "Êtes-vous sûr de vouloir continuer? (y/n): " confirm

        if [ "$confirm" =~ ^[Yy]$ ]; then
            echo -e "\n${YELLOW}🔄 Rollback en cours...${NC}"
            exec_in_backend pnpm typeorm migration:revert -d dist/src/core/config/data-source.js
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Rollback effectué avec succès!${NC}"
            else
                echo -e "${RED}❌ Échec du rollback!${NC}"
            fi
        else
            echo -e "${YELLOW}❌ Rollback annulé${NC}"
        fi
        ;;
    
    5)
        echo -e "\n${YELLOW}📜 Historique des migrations:${NC}"
        exec_in_backend pnpm typeorm migration:show -d dist/src/core/config/data-source.js
        ;;
    
    *)
        echo -e "${RED}❌ Choix invalide${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✨ Opération terminée!${NC}"