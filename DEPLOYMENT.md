# Déploiement sur Raspberry Pi

## Architecture

L'infrastructure est containerisée avec Docker et comprend :
- **Backend NestJS** : API principale (port 8080)
- **Prometheus** : Collecte des métriques (port 9090)  
- **Grafana** : Visualisation des métriques (port 3001)
- **Node Exporter** : Métriques système (port 9100)

PostgreSQL et Redis sont installés directement sur le serveur (non containerisés).

## Prérequis

- Docker et docker-compose installés
- PostgreSQL et Redis installés et configurés sur le serveur
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
# Database (PostgreSQL sur l'hôte)
DB_HOST=localhost  # Le script convertira automatiquement en host.docker.internal
DB_PORT=5432
DB_NAME=infra
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Redis (sur l'hôte)
REDIS_HOST=localhost  # Le script convertira automatiquement en host.docker.internal
REDIS_PORT=6379
REDIS_PASSWORD=redis
REDIS_USERNAME=redis
REDIS_TLS=true

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRATION=7d

# API
API_RATE_LIMIT=100
API_RATE_WINDOW=300000

# Autres...
```

**Note importante** : Le script `start_prod.sh` remplace automatiquement `localhost` par `host.docker.internal` pour permettre aux conteneurs Docker d'accéder à PostgreSQL et Redis sur la machine hôte.

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
./stop_prod.sh

# Mettre à jour le code
git pull

# Redémarrer avec rebuild
./start_prod.sh
```

### Sauvegarde des données

Les volumes Docker persistent les données de :
- Prometheus : `prometheus-data`
- Grafana : `grafana-data`

Pour sauvegarder :
```bash
docker run --rm -v infra-control_prometheus-data:/data -v $(pwd):/backup alpine tar czf /backup/prometheus-backup.tar.gz -C /data .
docker run --rm -v infra-control_grafana-data:/data -v $(pwd):/backup alpine tar czf /backup/grafana-backup.tar.gz -C /data .
```

## Dépannage

### Les services ne démarrent pas

1. Vérifier les logs : `docker-compose -f docker-compose.prod.yml logs`
2. Vérifier que PostgreSQL et Redis sont accessibles
3. Vérifier les ports disponibles : `netstat -tlnp`

### Problèmes de connexion à la base de données

- Vérifier que PostgreSQL accepte les connexions depuis Docker
- Vérifier les credentials dans `.env`
- Tester la connexion : `psql -h localhost -U your_user -d infra_control`

### Grafana ne charge pas les dashboards

- Vérifier que Prometheus est accessible depuis Grafana
- Réimporter manuellement le dashboard depuis `/grafana/provisioning/dashboards/`