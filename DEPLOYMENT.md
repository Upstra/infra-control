# Guide de Déploiement - Infra Control

## 🚀 DÉPLOIEMENT ULTRA SIMPLE

### Sur votre machine locale

```bash
# 1. Créer l'archive avec tout le nécessaire
cd /Users/james/Documents/PROJETS/5AL/PA2025/infra-control
tar -czf deploy-infra-control.tar.gz .

# 2. Copier sur le Raspberry Pi
scp deploy-infra-control.tar.gz pi@IP_RASP:~/
```

### Sur le Raspberry Pi

```bash
# 1. Se connecter et extraire
ssh pi@IP_RASP
tar -xzf deploy-infra-control.tar.gz
cd infra-control

# 2. Lancer le déploiement automatique
./infra deploy
```

## ✅ C'EST TOUT !

Le script `./infra deploy` fait tout automatiquement :
- ✓ Vérifie Docker
- ✓ Crée les dossiers
- ✓ Construit les images
- ✓ Démarre PostgreSQL et Redis
- ✓ Restaure la backup
- ✓ Démarre le backend
- ✓ Démarre le monitoring
- ✓ Vérifie que tout fonctionne

---

## 📌 Commandes utiles avec ./infra

```bash
./infra deploy   # Déploiement complet initial
./infra start    # Démarrer tous les services
./infra stop     # Arrêter tous les services
./infra status   # Voir l'état des services
./infra logs     # Voir les logs
./infra backup   # Faire une sauvegarde
./infra restore  # Restaurer une sauvegarde
./infra help     # Aide complète
```

### Voir les logs d'un service spécifique
```bash
./infra logs backend    # Logs du backend uniquement
./infra logs postgres   # Logs de PostgreSQL
./infra logs redis      # Logs de Redis
```

---

## 🔧 Configuration

Le script détecte automatiquement l'environnement :
- Sur Raspberry Pi → utilise `.env.rasp`
- En production → utilise `.env.prod` 
- En développement → utilise `.env`

---

## 📝 En cas de problème

### Réinitialiser complètement
```bash
./infra clean   # ATTENTION: Supprime toutes les données
./infra deploy  # Refaire le déploiement
```

### Vérifier l'état
```bash
./infra status  # Montre l'état de tous les services avec tests de santé
```

### Debug
```bash
./infra logs backend    # Logs du backend
docker ps               # Voir tous les conteneurs
```

---

## 🎯 Résumé des étapes manuelles (si ./infra ne marche pas)

```bash
# Tout en une commande
cd ~/infra-control && \
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres redis && \
sleep 15 && \
docker exec -i infra-control-postgres psql -U postgres postgres < backups/production_*.sql && \
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d && \
sleep 30 && \
curl http://localhost:8080/health/simple && echo " ✅ Déploiement réussi !"
```