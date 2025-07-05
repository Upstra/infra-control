#!/bin/bash

echo "🔧 Script de migration vers Docker avec TypeORM"
echo "=============================================="
echo ""
echo "Ce script aide à configurer les migrations TypeORM pour votre déploiement Docker."
echo ""

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé!"
    echo "   Créez d'abord votre fichier .env avec les variables nécessaires."
    exit 1
fi

echo "📝 Instructions pour exécuter les migrations en production:"
echo ""
echo "1. PREMIERE EXECUTION (initialisation de la base):"
echo "   ./start.sh"
echo "   Les migrations seront automatiquement exécutées au démarrage du conteneur."
echo ""
echo "2. GENERER UNE NOUVELLE MIGRATION (en développement):"
echo "   pnpm migration:generate -n NomDeLaMigration"
echo ""
echo "3. EXECUTER LES MIGRATIONS MANUELLEMENT (si nécessaire):"
echo "   docker exec infra-control-backend pnpm migration:run"
echo ""
echo "4. VERIFIER L'ETAT DES MIGRATIONS:"
echo "   docker exec infra-control-backend pnpm typeorm migration:show -d dist/src/core/config/data-source.js"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Les migrations sont exécutées automatiquement au démarrage du conteneur"
echo "   - Vérifiez que toutes vos entités sont correctement exportées"
echo "   - Testez toujours les migrations en environnement de développement d'abord"
echo ""
echo "✅ Configuration terminée!"