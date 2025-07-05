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

if [ -f .env ]; then
    source .env
    ORIGINAL_DB_HOST=$DB_HOST
    ORIGINAL_REDIS_HOST=$REDIS_HOST
    
    export DB_HOST=host.docker.internal
    export REDIS_HOST=host.docker.internal
    
    export $(grep -v '^#' .env | grep -v '^DB_HOST=' | grep -v '^REDIS_HOST=' | xargs)
    
    echo "📝 Configuration Docker:"
    echo "   - DB_HOST: localhost → host.docker.internal"
    echo "   - REDIS_HOST: localhost → host.docker.internal"
else
    echo "❌ Fichier .env non trouvé. Veuillez le créer."
    exit 1
fi

echo "🔍 Vérification des services locaux..."

if pg_isready -h localhost -p ${DB_PORT:-5432} -U ${DB_USERNAME:-postgres} > /dev/null 2>&1; then
    echo "✅ PostgreSQL est accessible sur localhost:${DB_PORT:-5432}"
else
    echo "❌ PostgreSQL n'est pas accessible. Vérifiez qu'il est démarré."
    echo "   Commande pour démarrer : sudo systemctl start postgresql"
    exit 1
fi

if redis-cli -h localhost -p ${REDIS_PORT:-6379} ping > /dev/null 2>&1; then
    echo "✅ Redis est accessible sur localhost:${REDIS_PORT:-6379}"
else
    echo "❌ Redis n'est pas accessible. Vérifiez qu'il est démarré."
    echo "   Commande pour démarrer : sudo systemctl start redis"
    exit 1
fi

echo "📦 Construction et démarrage des conteneurs..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ Attente du démarrage des services..."
sleep 10

echo "✅ État des services:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🎉 Infrastructure démarrée avec succès!"
echo ""
echo "📊 Accès aux services:"
echo "  - Backend API: http://localhost:8080"
echo "  - Swagger Docs: http://localhost:8080/docs"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "💡 Pour voir les logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Pour arrêter: docker-compose -f docker-compose.prod.yml down"
