#!/bin/bash

echo "🛑 Arrêt de l'infrastructure Infra Control..."

docker-compose -f docker-compose.prod.yml down

echo "✅ Infrastructure arrêtée avec succès!"