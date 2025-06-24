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
APP_PORT=3000

JWT_SECRET=jwt_secret
JWT_EXPIRATION=1h
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
