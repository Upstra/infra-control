#!/bin/bash

echo "🚀 Démarrage de l'infrastructure Infra Control..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Utiliser .env.prod si disponible, sinon .env
ENV_FILE=".env.prod"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
    # Exporter toutes les variables
    export $(grep -v '^#' $ENV_FILE | xargs)
    echo "✅ Variables d'environnement chargées depuis $ENV_FILE"
else
    echo "❌ Aucun fichier d'environnement trouvé (.env.prod ou .env)!"
    exit 1
fi

# Vérifier les variables essentielles
echo "🔍 Vérification de la configuration..."
missing_vars=()

# Liste des variables requises
required_vars=(
    "DB_NAME"
    "DB_USERNAME"
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "SESSION_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Variables manquantes dans .env:"
    printf '   - %s\n' "${missing_vars[@]}"
    exit 1
fi

echo "✅ Configuration complète"

echo "📦 Construction et démarrage des conteneurs..."
docker-compose -f docker-compose.prod.yml --env-file $ENV_FILE up -d --build

echo "⏳ Attente du démarrage des services..."
echo "   - PostgreSQL et Redis..."
sleep 15
echo "   - Backend..."
sleep 10

echo "✅ État des services:"
docker-compose -f docker-compose.prod.yml --env-file $ENV_FILE ps

echo ""
echo "🎉 Infrastructure démarrée avec succès!"
echo ""
echo "📊 Accès aux services:"
echo "  - Backend API: http://localhost:8080"
echo "  - Swagger Docs: http://localhost:8080/docs"
echo "  - PostgreSQL: localhost:${DB_PORT:-5432}"
echo "  - Redis: localhost:${REDIS_PORT:-6379}"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "💡 Pour voir les logs: docker-compose -f docker-compose.prod.yml --env-file $ENV_FILE logs -f"
echo "🛑 Pour arrêter: docker-compose -f docker-compose.prod.yml --env-file $ENV_FILE down"
