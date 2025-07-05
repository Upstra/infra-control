# Guide de Migration Production

## Vue d'ensemble

Ce guide explique comment gérer les migrations de base de données en production pour Infra Control.

## Première installation

Pour une première mise en production, utilisez le script d'initialisation :

```bash
# Copier et configurer .env.prod
cp .env.prod.example .env.prod
# Éditer .env.prod avec vos valeurs

# Lancer l'initialisation complète
./scripts/init-prod.sh
```

Ce script :
- Vérifie la configuration
- Démarre l'infrastructure Docker
- Initialise la base de données
- Exécute les migrations initiales
- Crée une sauvegarde de référence

## Prérequis pour les mises à jour

1. Avoir un fichier `.env.prod` configuré (basé sur `.env.prod.example`)
2. L'infrastructure Docker doit être en cours d'exécution (`./infra start`)
3. Avoir généré les migrations nécessaires en développement

## Script de migration

Un script dédié `scripts/migrate-prod.sh` est disponible pour gérer les migrations en production de manière sécurisée.

### Utilisation

```bash
./scripts/migrate-prod.sh
```

Le script propose plusieurs options :

1. **Vérifier l'état des migrations** : Affiche les migrations exécutées et en attente
2. **Exécuter les migrations** : Applique les migrations en attente (avec sauvegarde automatique)
3. **Créer une sauvegarde** : Sauvegarde manuelle de la base et des volumes
4. **Rollback** : Annuler la dernière migration
5. **Historique** : Voir toutes les migrations

## Workflow recommandé

### 1. Développement local

```bash
# Générer une nouvelle migration après modification des entités
pnpm migration:generate -n NomDescriptifDeLaMigration

# Tester la migration localement
pnpm migration:run
```

### 2. Mise en production

```bash
# 1. Déployer le nouveau code
git pull
./infra stop
./infra start

# 2. Vérifier l'état des migrations
./scripts/migrate-prod.sh
# Choisir option 1

# 3. Créer une sauvegarde (optionnel mais recommandé)
./scripts/migrate-prod.sh
# Choisir option 3

# 4. Exécuter les migrations
./scripts/migrate-prod.sh
# Choisir option 2
```

## Migrations automatiques vs manuelles

### Automatique (par défaut)

Les migrations sont exécutées automatiquement au démarrage du conteneur via `docker-entrypoint.sh`. C'est pratique mais peut être risqué en production.

### Manuelle (recommandé pour la production)

Pour désactiver les migrations automatiques et utiliser uniquement le script manuel :

1. Modifier `docker-entrypoint.sh` pour commenter la ligne de migration :
```bash
# pnpm migration:run
```

2. Utiliser `./scripts/migrate-prod.sh` pour toutes les migrations

## Sauvegardes

### Sauvegarde automatique

Le script crée automatiquement une sauvegarde avant chaque migration dans `backups/auto_migration_[date]/`.

### Sauvegarde manuelle

```bash
./scripts/migrate-prod.sh
# Choisir option 3
```

Crée une sauvegarde complète dans `backups/manual_[date]/` incluant :
- `database_backup.sql` : Dump SQL complet
- `postgres-data.tar.gz` : Volume Docker PostgreSQL
- `redis-data.tar.gz` : Volume Docker Redis

### Restauration

En cas de problème :

```bash
# Restaurer depuis un dump SQL
docker exec -i infra-control-postgres psql -U $DB_USERNAME $DB_NAME < backups/[dossier]/database_backup.sql

# Restaurer un volume complet (arrêter d'abord les services)
./infra stop
docker run --rm -v infra-control_postgres-data:/data -v $(pwd)/backups/[dossier]:/backup alpine tar xzf /backup/postgres-data.tar.gz -C /data
./infra start
```

## Bonnes pratiques

1. **Toujours tester les migrations en développement** avant la production
2. **Créer une sauvegarde** avant toute migration importante
3. **Vérifier l'état** des migrations avant et après exécution
4. **Documenter** les changements importants dans les messages de commit
5. **Planifier** les migrations pendant les heures de maintenance

## Dépannage

### Les migrations échouent

1. Vérifier les logs : `docker logs infra-control-backend`
2. Vérifier la connexion à la base : `docker exec -it infra-control-postgres psql -U $DB_USERNAME -d $DB_NAME`
3. Restaurer depuis la sauvegarde si nécessaire

### Rollback d'urgence

```bash
# Option 1 : Via le script
./scripts/migrate-prod.sh
# Choisir option 4

# Option 2 : Restauration complète depuis sauvegarde
docker exec -i infra-control-postgres psql -U $DB_USERNAME $DB_NAME < backups/[derniere_sauvegarde]/database_backup.sql
```

### Vérifier l'intégrité

Après une migration ou restauration :

```bash
# Vérifier l'état de la base
docker exec infra-control-backend pnpm typeorm migration:show -d dist/src/core/config/data-source.js

# Tester l'application
curl http://localhost:8080/health
```

## Notes importantes

- Les migrations TypeORM sont **irréversibles** par défaut. Testez toujours en développement !
- Le script nécessite que l'infrastructure soit démarrée
- Les sauvegardes sont stockées localement dans le dossier `backups/`
- Pensez à sauvegarder régulièrement le dossier `backups/` sur un stockage externe