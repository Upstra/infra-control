# 🏗️ Diagramme C4 - Niveau 3 : Composants

Cette vue zoome sur l'application NestJS et décrit quelques modules
avec leurs contrôleurs et use cases.

```mermaid
graph LR
    subgraph "NestJS API"
        Auth[Auth Module]
        Users[Users Module]
        Servers[Servers Module]
        Presence[Presence Module]
    end
    DB[(PostgreSQL)]
    REDIS[(Redis)]

    Auth --> AuthCtrl[AuthController]
    AuthCtrl --> AuthUC[Auth Use Cases]

    Users --> UsersCtrl[UsersController]
    UsersCtrl --> UsersUC[Users Use Cases]

    Servers --> ServersCtrl[ServersController]
    ServersCtrl --> ServersUC[Servers Use Cases]

    Presence --> PresenceCtrl[PresenceController]
    PresenceCtrl --> PresenceService

    AuthUC --> DB
    UsersUC --> DB
    ServersUC --> DB
    PresenceService --> REDIS
```

Ce diagramme simplifie l'organisation interne : chaque contrôleur
appelle des use cases, lesquels accèdent soit à la base de données,
soit au cache Redis pour la présence en ligne.

Le module **Presence** conserve pour chaque utilisateur connecté une clé
`presence:<userId>` dans Redis. Le TTL de 60 secondes est réinitialisé
régulièrement afin d'indiquer que la session est toujours active.
