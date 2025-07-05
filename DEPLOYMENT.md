# Déploiement

## Architecture

L'infrastructure complète est containerisée avec Docker et comprend :
- **PostgreSQL** : Base de données (port 5432)
- **Redis** : Cache et sessions (port 6379)
- **Backend NestJS** : API principale (port 8080)
- **Prometheus** : Collecte des métriques (port 9090)  
- **Grafana** : Visualisation des métriques (port 3001)
- **Node Exporter** : Métriques système (port 9100)

Tout est géré via Docker Compose pour une installation simplifiée.

## Prérequis

- Docker et docker-compose installés
- Fichier `.env` configuré avec toutes les variables nécessaires

## Démarrage

### Méthode simplifiée (recommandée)

```bash
# Démarrer tous les services
./infra start

# Vérifier l'état
./infra status

# Voir les logs
./infra logs

# Arrêter tous les services
./infra stop

# Redémarrer
./infra restart
```

### Méthode directe

```bash
# Démarrer
./scripts/start.sh

# Arrêter
./scripts/stop.sh

# Vérifier la santé
./scripts/health-check.sh
```

## Accès aux services

- **Backend API** : http://localhost:8080
- **Documentation Swagger** : http://localhost:8080/docs
- **Métriques Prometheus** : http://localhost:8080/metrics
- **Interface Prometheus** : http://localhost:9090
- **Grafana** : http://localhost:3001 (login: admin/admin)

## Configuration

### Variables d'environnement

Le fichier `.env` doit contenir vos configurations habituelles :

```env
# Database (PostgreSQL)
DB_PORT=5432
DB_NAME=infra
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRATION=7d

# Session
SESSION_SECRET=your_session_secret

# Setup
SETUP_KEY=your_setup_key

# API Rate Limiting
API_RATE_LIMIT=100
API_RATE_WINDOW=300000

# Swagger
SWAGGER_TITLE=Infra Control API
SWAGGER_DESCRIPTION=API for infrastructure management
SWAGGER_VERSION=1.0

# GitHub
GITHUB_TOKEN=your_github_token
FRONT_REPO=owner/repo-front
BACK_REPO=owner/repo-back

# URLs (optionnel)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080

# Grafana (optionnel)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_grafana_password
```

**Note** : Les variables `DB_HOST` et `REDIS_HOST` ne sont plus nécessaires car Docker gère automatiquement la connexion entre les conteneurs.

### Monitoring

Les métriques sont exposées sur `/metrics` et collectées par Prometheus toutes les 15 secondes.

Un dashboard Grafana est automatiquement provisionné avec :
- Utilisation CPU
- Utilisation mémoire
- État du backend
- Taux de requêtes HTTP

## Maintenance

### Mise à jour du backend

```bash
# Arrêter les services
./infra stop

# Mettre à jour le code
git pull

# Redémarrer avec rebuild
./infra start
```

### Sauvegarde des données

Les volumes Docker persistent les données de :
- PostgreSQL : `postgres-data`
- Redis : `redis-data`
- Prometheus : `prometheus-data`
- Grafana : `grafana-data`

Pour sauvegarder :
```bash
# Créer un dossier de sauvegarde
mkdir -p backups

# Sauvegarder PostgreSQL
docker exec infra-control-postgres pg_dump -U $DB_USERNAME $DB_NAME > backups/postgres-$(date +%Y%m%d).sql

# Sauvegarder les volumes
docker run --rm -v infra-control_postgres-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v infra-control_redis-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/redis-data-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v infra-control_prometheus-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/prometheus-data-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v infra-control_grafana-data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/grafana-data-$(date +%Y%m%d).tar.gz -C /data .
```

## Dépannage

### Les services ne démarrent pas

1. Vérifier les logs : `docker-compose -f docker-compose.prod.yml logs`
2. Vérifier que PostgreSQL et Redis sont accessibles
3. Vérifier les ports disponibles : `netstat -tlnp`

### Problèmes de connexion à la base de données

- Vérifier les logs PostgreSQL : `docker logs infra-control-postgres`
- Vérifier les credentials dans `.env`
- Tester la connexion : `docker exec -it infra-control-postgres psql -U $DB_USERNAME -d $DB_NAME`

### Réinitialiser complètement

```bash
# Arrêter et supprimer tout (ATTENTION : supprime les données)
docker-compose -f docker-compose.prod.yml down -v

# Nettoyer les images
docker system prune -a

# Redémarrer
./infra start
```

### Grafana ne charge pas les dashboards

- Vérifier que Prometheus est accessible depuis Grafana
- Réimporter manuellement le dashboard depuis `/grafana/provisioning/dashboards/`