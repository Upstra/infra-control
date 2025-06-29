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

---

## 📦 Stack technique

- **NestJS 11** avec `@nestjs/typeorm`
- **TypeORM** + PostgreSQL
- **Passport + JWT**
- **2FA avec Speakeasy + QRCode**
- **Swagger** auto-documenté
- **Docker** ready


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
```

Copy `.env-example` to `.env` (or rename `.env-local` to `.env`) and fill in your database credentials before running commands.

---

## 🐳 Démarrage avec Docker

```bash
# Pour lancer toute l'infra (Nest + PostgreSQL)
docker-compose up --build
```

Puis l’API est dispo sur `http://localhost:3000`  
La doc Swagger est dispo sur `http://localhost:3000/api`

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
