# Configuration Rate Limiting

Ce document explique la configuration du système de rate limiting implémenté dans l'API Infra Control.

## Vue d'ensemble

L'application utilise un système de rate limiting à plusieurs niveaux pour protéger contre les abus et les attaques par déni de service. Le système est entièrement configurable via des variables d'environnement.

## Architecture

### 🔒 Guards Implémentés

#### 1. **Rate Limiting Global** (main.ts)
Protection générale de toute l'application contre les requêtes excessives.

#### 2. **AuthRateLimitGuard**
Protection spécialisée pour les endpoints d'authentification avec deux niveaux :
- **Strict** : Login/Register (5 tentatives par défaut)
- **Modéré** : 2FA (10 tentatives par défaut)

#### 3. **SensitiveOperationsGuard**
Protection pour les opérations critiques (création/suppression d'utilisateurs, modification de rôles, etc.)

#### 4. **ApiUsageGuard**
Protection standard pour l'utilisation générale de l'API.

## Variables d'environnement

### Configuration Global Rate Limiting

```bash
# Rate limiting global (toutes les requêtes)
RATE_LIMIT_GLOBAL_WINDOW_MS=900000    # Fenêtre de temps en ms (15 min par défaut)
RATE_LIMIT_GLOBAL_MAX=1000            # Nombre max de requêtes par fenêtre
```

### Configuration Authentication Rate Limiting

```bash
# Rate limiting pour l'authentification
RATE_LIMIT_AUTH_WINDOW_MS=900000      # Fenêtre de temps en ms (15 min par défaut)
RATE_LIMIT_AUTH_STRICT_MAX=5          # Login/register: max 5 tentatives
RATE_LIMIT_AUTH_MODERATE_MAX=10       # 2FA: max 10 tentatives
```

### Configuration Sensitive Operations

```bash
# Rate limiting pour les opérations sensibles
RATE_LIMIT_SENSITIVE_WINDOW_MS=3600000 # Fenêtre de temps en ms (1 heure par défaut)
RATE_LIMIT_SENSITIVE_MAX=3             # Max 3 opérations sensibles par heure
```

### Configuration API Usage

```bash
# Rate limiting pour l'usage général de l'API
RATE_LIMIT_API_WINDOW_MS=300000       # Fenêtre de temps en ms (5 min par défaut)
RATE_LIMIT_API_MAX=100                # Max 100 requêtes par fenêtre
```

## Application des Guards

### AuthRateLimitGuard
**Endpoints protégés :**
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/2fa/verify`

**Logique de limitation :**
- Clé unique basée sur IP + email (si disponible) ou IP + User-Agent
- Login/Register : Limitation stricte (5 tentatives/15min)
- 2FA : Limitation modérée (10 tentatives/15min)

### SensitiveOperationsGuard
**Endpoints protégés :**
- `POST /role` - Création de rôle
- `POST /role/admin` - Création rôle admin
- `PATCH /role/:id` - Modification de rôle
- `DELETE /role/:id` - Suppression de rôle
- `PATCH /role/users/:userId/role` - Changement de rôle utilisateur
- `POST /setup/vm-discovery/complete` - Configuration système
- `POST /setup/step/complete` - Étapes de setup
- Toutes les opérations CUD sur les permissions

**Logique de limitation :**
- Clé unique basée sur IP + ID utilisateur
- Limite : 3 opérations par heure par défaut

### ApiUsageGuard
**Endpoints protégés :**
- Tous les endpoints GET (consultations)
- Opérations de modification de profil utilisateur
- Endpoints de statut et progression

**Logique de limitation :**
- Clé unique basée sur ID utilisateur (si connecté) ou IP
- Limite : 100 requêtes par 5 minutes par défaut

## Configuration par environnement

### Développement (Recommandé)
```bash
RATE_LIMIT_AUTH_STRICT_MAX=50         # Plus permissif pour les tests
RATE_LIMIT_SENSITIVE_MAX=50           # Permet plus d'opérations
RATE_LIMIT_API_MAX=1000               # Très permissif
```

### Staging
```bash
RATE_LIMIT_AUTH_STRICT_MAX=10         # Intermédiaire
RATE_LIMIT_SENSITIVE_MAX=10           # Intermédiaire
RATE_LIMIT_API_MAX=200                # Modéré
```

### Production (Sécurisé)
```bash
RATE_LIMIT_AUTH_STRICT_MAX=3          # Très strict
RATE_LIMIT_SENSITIVE_MAX=2            # Très restrictif
RATE_LIMIT_API_MAX=50                 # Limité
```

## Fonctionnalités avancées

### 🧪 Skip automatique en test
Tous les guards ignorent automatiquement les limitations quand `NODE_ENV=test`.

### 🏠 Whitelist IP locale
Les adresses IP locales (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) sont automatiquement exemptées des limitations.

### 📊 Headers de réponse
Les guards ajoutent automatiquement des headers HTTP standards pour informer les clients :
- `X-RateLimit-Limit` : Limite maximale
- `X-RateLimit-Remaining` : Requêtes restantes
- `X-RateLimit-Reset` : Timestamp de reset

### 🔄 Réponses d'erreur
En cas de dépassement de limite :
```json
{
  "error": "Trop de tentatives de connexion. Réessayez plus tard.",
  "statusCode": 429
}
```

## Monitoring et débogage

### Logs recommandés
Pour surveiller les rate limits en production, ajoutez des logs dans vos middlewares de monitoring pour capturer :
- Les requêtes bloquées (status 429)
- Les patterns d'utilisation par IP/utilisateur
- Les pics de trafic sur les endpoints sensibles

### Métriques utiles
- Nombre de requêtes bloquées par endpoint
- Top des IPs/utilisateurs bloqués
- Distribution des erreurs 429 dans le temps

## Troubleshooting

### Problem: Les tests échouent à cause du rate limiting
**Solution :** Vérifiez que `NODE_ENV=test` est défini dans votre environnement de test.

### Problem: Un utilisateur légitime est bloqué
**Solutions :**
1. Augmentez temporairement les limites via les variables d'environnement
2. Ajoutez son IP à la whitelist dans le code (pour les environnements contrôlés)
3. Implémentez un système de deblocage manuel

### Problem: Les attaques passent encore
**Solutions :**
1. Diminuez les valeurs `_MAX` dans les variables d'environnement
2. Réduisez les `_WINDOW_MS` pour des fenêtres plus courtes
3. Ajoutez des guards supplémentaires sur d'autres endpoints critiques

## Évolutions futures

### Améliorations possibles
1. **Rate limiting par utilisateur** : Limites personnalisées par rôle
2. **Backend Redis** : Stockage distribué pour la scalabilité
3. **Rate limiting adaptatif** : Ajustement automatique selon la charge
4. **Dashboard de monitoring** : Interface de visualisation des métriques