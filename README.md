# 🛠️ Infra Control - Backend API

> Gestion d’infrastructure pour les environnements critiques (laboratoires, VM, serveurs, salles)  
> API REST modulaire, sécurisée, avec authentification JWT + 2FA, orientée Domain Driven Design (DDD)

---

## 🚀 À quoi sert ce projet ?

**Infra Control** est une API backend permettant :

- 🔐 Authentification sécurisée (login/register + JWT + 2FA via QR Code)
- 🏢 Gestion d’utilisateurs, rôles et permissions
- 🖥️ Contrôle d’objets d’infrastructure (machines, VMs, serveurs, racks)
- 🧩 Architecture modulaire et scalable (feature-first, DDD)
- 🔋 Télémétrie complète des onduleurs (secteur/batterie, charge, puissance, température) via SNMP, NUT ou simulateur
- 🚨 Alertes dédupliquées avec acquittement, résolution automatique et fil d'événements unifié
- 🖥️ Santé de tout le parc VMware en une seule session vCenter, avec la cause de chaque arrêt de VM (HA, plan Upstra, manuel)
- 🌡️ Santé matérielle des serveurs via Redfish (température d'entrée d'air, alimentations, consommation)
- 📈 Historique des mesures dans Prometheus, servi au front sur 1 h / 24 h / 7 j

---

## 📦 Stack technique

- **NestJS 11** avec `@nestjs/typeorm`
- **TypeORM** + PostgreSQL
- **Passport + JWT**
- **2FA avec Speakeasy + QRCode**
- **Rate Limiting** multi-niveau (Helmet + express-rate-limit)
- **Swagger** auto-documenté
- **Docker** ready
- **Prometheus** pour le monitoring
- **Grafana** pour les dashboards

## 📸 Aperçu

![Swagger : endpoints des alertes](docs/images/swagger-alerts.png)

La documentation interactive complète est servie sur `http://localhost:3000/docs`.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    subgraph Client
        FRONT[Front Vue 3 Upstra]
    end

    subgraph API[infra-control · NestJS]
        REST[Controllers REST]
        WS["Gateways WebSocket<br/>/ups · /alerts · /vmware · présence"]
        UC[Use cases]
        DOM["Domain services<br/>santé, alertes, seuils"]
        SCHED["Schedulers<br/>onduleurs, VMware, iLO"]
        EVT((EventEmitter2))
        PY[PythonExecutorService]
        METRICS["/metrics · prom-client"]
    end

    subgraph Scripts[ups_manager · Python]
        UPS_S[ups_battery]
        VMW_S["inventory_metrics<br/>vcenter_events"]
        ILO_S[ilo_health]
        PLAN["migration_plan<br/>restart_plan"]
    end

    PG[(PostgreSQL)]
    REDIS[("Redis<br/>cache, verrous, présence")]
    PROM[(Prometheus)]
    VC["vCenter / ESXi"]
    ILO[HP iLO Redfish]
    UPSDEV["Onduleur SNMP / NUT"]

    FRONT -- "HTTPS + JWT" --> REST
    FRONT <-- "Socket.io" --> WS
    REST --> UC --> DOM
    UC --> PG
    UC --> REDIS
    SCHED --> UC
    SCHED -- "verrou SET NX" --> REDIS
    UC --> PY
    PY -- "secrets en variables d'env" --> Scripts
    UPS_S --> UPSDEV
    VMW_S --> VC
    PLAN --> VC
    PLAN --> ILO
    ILO_S --> ILO
    UC -- "événements" --> EVT
    EVT --> WS
    EVT --> METRICS
    PROM -- "scrape" --> METRICS
    REST -- "/metrics/series" --> PROM
```

Chaque module suit la même découpe DDD (`application/`, `domain/`, `infrastructure/`) décrite dans `CLAUDE.md`. Les schedulers ne lancent jamais un script par objet : une collecte = un process Python, protégé par un verrou Redis pour qu'une seule instance tourne à la fois.

---

## 🔄 Flux complet de la requête

Cette vue d'ensemble montre le chemin parcouru par une requête HTTP depuis le client jusqu'à la base de données.

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Filtres & Pipes
    participant Ctrl as Controller
    participant UC as Use Case
    participant DS as Domain Service
    participant Repo as Repository
    participant DB as PostgreSQL

    C->>Ctrl: Requête HTTP
    Ctrl->>F: Validation & Guards
    F-->>Ctrl: Ok
    Ctrl->>UC: Appel du use case
    UC->>DS: Logique métier
    DS->>Repo: Accès données
    Repo->>DB: Requêtes SQL
    DB-->>Repo: Résultats
    Repo-->>DS: Entités
    DS-->>UC: Retour
    UC-->>Ctrl: Réponse
    Ctrl-->>C: Réponse HTTP
```

---

## ⚙️ Requirements

### ✅ Local

- Node.js `^20.x`
- pnpm `^8.x`
- PostgreSQL (ou Docker pour l’avoir intégré)
- Docker (optionnel mais recommandé)

### ✅ Variables d’environnement `.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=infra
DB_USERNAME=postgres
DB_PASSWORD=postgres

JWT_SECRET=jwt_secret
JWT_EXPIRATION=1h
JWT_2FA_TOKEN_EXPIRATION=5m
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis
REDIS_USERNAME=redis
REDIS_TLS=true

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3002

# Rate Limiting Configuration (voir docs/rate-limiting.md)
RATE_LIMIT_GLOBAL_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_GLOBAL_MAX=1000            # 1000 requests per window

RATE_LIMIT_AUTH_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_AUTH_STRICT_MAX=5          # Login/register: 5 attempts
RATE_LIMIT_AUTH_MODERATE_MAX=10       # 2FA: 10 attempts

RATE_LIMIT_SENSITIVE_WINDOW_MS=3600000 # 1 hour
RATE_LIMIT_SENSITIVE_MAX=3             # 3 operations per hour

RATE_LIMIT_API_WINDOW_MS=300000       # 5 minutes
RATE_LIMIT_API_MAX=100                # 100 requests per window

RATE_LIMIT_DASHBOARD_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_DASHBOARD_WIDGET_MAX=200  # 200 requests per minute

GITHUB_TOKEN=
FRONT_REPO=Upstra/upstra-control_front
BACK_REPO=Upstra/upstra-control

ENCRYPTION_KEY=your_encryption_key_here
```
Copy `.env-example` to `.env` (or rename `.env-local` to `.env`) and fill in your database credentials before running commands.

Note:

- Vous aurez besoin d'un `GITHUB_TOKEN` pour assurer le bon fonctionnement du module release, qui fetch les release front + back afin de les afficher au client
- Le `ENCRYPTION_KEY` est utilisé pour chiffrer les données sensibles (comme les mots de passe) dans la base de données. Il doit être une chaîne hexadécimale de 32 caractères. A voir dans `docs/password-encryption.md` pour plus de détails sur la configuration et la génération de la clé.

---

## 🐳 Démarrage avec Docker

Le script va s'occuper de lancer les containers:

- Prometheus (monitoring)
- Grafana (dashboards)
- NestJS (infra-control)

**Note**: En production sur Raspberry Pi, PostgreSQL et Redis sont installés nativement sans Docker.

```bash
# Pour lancer toute l'infra avec monitoring
./start_prod.sh
```

Puis l’API est dispo sur `http://localhost:3000`
La doc Swagger est dispo sur `http://localhost:3000/docs`
Le JSON du schéma est disponible sur `http://localhost:3000/docs-json`

### Email Transactionnel

**Dossier** : src/modules/email

**Templates** : src/modules/email/infrastructure/templates/\*.hbs

**Use-Cases** :

```
SendAccountCreatedEmailUseCase

SendResetPasswordEmailUseCase

SendPasswordChangedEmailUseCase
```

**Configuration** : variables d’environnement listées ci-dessus.

Pour créer un nouveau template, ajoutez un xxx.hbs et un SendXxxEmailUseCase.

### 📊 Monitoring avec Prometheus et Grafana

L'application expose des métriques Prometheus sur `/metrics`:

- **Prometheus**: `http://localhost:9090` - Collecte et stockage des métriques
- **Grafana**: `http://localhost:3001` - Visualisation des métriques
  - Login: admin / Password: admin

Les métriques incluent:

- Utilisation CPU et mémoire
- Event loop lag
- Handles et requêtes actives
- Statistiques de garbage collection

Pour ajouter des métriques personnalisées dans votre code:

```typescript
import { Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'infra_control_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});
```

---

## 🧪 Tests

Les tests sont organisés par **feature** avec :

- ✅ tests unitaires (`*.spec.ts`) pour DTOs, guards, use cases
- 🔒 tests e2e prévus pour `/auth`, `/users`, etc.

### 📥 Installation des dépendances

```bash
pnpm install
```

### ▶️ Lancer **tous** les tests

```bash
pnpm test
```

### 🔁 Lancer les tests en **mode watch**

```bash
pnpm test:watch
```

### 📊 Lancer les tests avec **couverture**

```bash
pnpm test:cov
```

#### Pour lancer la couverture sur un module spécifique :

```bash
pnpm test:cov -- src/modules/auth
```

#### Pour lancer la couverture sur un test spécifique :

```bash
pnpm test:cov -- src/modules/auth/__tests__/auth.controller.spec.ts
```

### 🧪 Lancer les **tests e2e**

```bash
pnpm test:e2e
```

---

## 🎯 Lancer uniquement les tests d’une feature (ex: `auth`)

```bash
pnpm test -- src/modules/auth
```

Ou même plus précis :

```bash
pnpm test -- src/modules/auth/__tests__/twofa.guard.spec.ts
```

---

## ✨ Structure de test

```bash
src/
└── modules/
    └── auth/
        ├── __tests__/                  # tests unitaires du controller, guards, etc.
        │   └── auth.controller.spec.ts
        ├── application/
        │   ├── use-cases/
        │   │   ├── login.use-case.ts
        │   │   └── __tests__/          # tests unitaires métier (DDD)
        │   │       └── login.use-case.spec.ts
        │   └── dto/
        │       ├── login.dto.ts
        │       └── __tests__/          # tests de validation class-validator
        │           └── login.dto.spec.ts
        ├── __mocks__/                  # mocks réutilisables (user, jwt, etc.)
        └── auth.controller.ts
```

---

## 🧼 Lint & format

```bash
pnpm lint      # corrige automatiquement
pnpm format    # beautifie le code
```

---

## 🗄️ Migrations

```bash
pnpm migration:generate
pnpm migration:run
```

Ces commandes utilisent `-r dotenv/config` pour charger automatiquement les variables d'environnement.

> ⚠️ En production (`migrationsRun`), TypeORM ne charge que `src/core/migrations`. Toute nouvelle migration doit y être placée.

---

## 🔒 Sécurité et Rate Limiting

L'application intègre un système de sécurité multi-niveau :

### 🛡️ Protection des Headers (Helmet)

- Content Security Policy (CSP)
- Protection XSS et clickjacking
- Headers de sécurité automatiques

### ⚡ Rate Limiting Intelligent

- **Rate limiting global** : Protection DDoS générale
- **Rate limiting auth** : Limitation des tentatives de connexion/2FA
- **Rate limiting sensitif** : Protection des opérations critiques (rôles, permissions)
- **Rate limiting API** : Limitation de l'usage général

📖 **Documentation complète** : [docs/rate-limiting.md](docs/rate-limiting.md)

### Configuration des limites par environnement

Les variables peuvent être ajustées selon l'environnement :

- **Développement** : Limites permissives pour faciliter les tests
- **Production** : Limites strictes pour la sécurité

---

### 🔑 Secrets, TLS et plans de migration

- Les mots de passe vCenter / iLO et la communauté SNMP ne passent plus en arguments des scripts Python (lisibles par `ps`) : `PythonExecutorService` les transmet par variables d'environnement (`UPSTRA_PASSWORD`, `UPSTRA_SNMP_COMMUNITY`) et ils restent masqués dans les logs.
- La vérification des certificats vCenter / iLO se règle avec `PYTHON_VERIFY_SSL=true` et `PYTHON_CA_BUNDLE=/chemin/ca.pem` (désactivée par défaut à cause des certificats auto-signés des iLO).
- Un seul plan de migration ou de redémarrage à la fois : verrou Redis atomique `migration:lock` (`SET NX EX`), délai maximal configurable via `MIGRATION_PLAN_TIMEOUT_MS` (30 min par défaut).

---

## ❤️ Tips

- Créer des mocks avec `__mocks__/createMockUser.ts` pour simplifier tes tests
- Il est possible de lancer `pnpm start:dev` pour du hot reload local

---

## ✍️ Auteurs

Projet réalisé dans le cadre du Master 2 en Architecture des Logiciels par :

[James ABIB](https://www.linkedin.com/in/jamesabib/)

[Ronan KIELT](https://www.linkedin.com/in/ronan-kielt/)

[Charles CRETOIS](https://www.linkedin.com/in/charles-cretois-43882a17b/)

---

## 📜 Licence

Infra Control est distribué sous licence **GNU Affero General Public License v3.0** (`AGPL-3.0-only`), voir [`LICENSE`](LICENSE).

En résumé : vous pouvez utiliser, modifier et redistribuer le code, y compris commercialement, à condition de publier sous la même licence le code source de toute version modifiée, **y compris lorsqu'elle est seulement proposée comme service accessible par le réseau**.

Copyright (C) 2025-2026 James ABIB, Ronan KIELT, Charles CRETOIS
