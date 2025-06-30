# 🏗️ Diagramme C4 - Contexte Système

1-System Context/[2-Container](./2-container.md)/[3-Components](./3-components.md)/[4-Code](./4-code.md)

Cette vue décrit l'API **Infra Control** dans son environnement global.

```mermaid
graph LR
    subgraph Utilisateurs
        A[Administrateurs]
        B[Services externes]
    end
    subgraph "Infra Control API"
        API
    end
    DB[(PostgreSQL)]
    REDIS[(Redis)]

    A-->|Requêtes HTTP|API
    B-->|Appels API|API
    API-->|Lecture/Écriture|DB
    API-->|Cache|REDIS
```

Ce premier niveau met en évidence les acteurs et dépendances
principales. Les utilisateurs (administrateurs et autres services)
interagissent avec l'API, qui communique avec la base de données
PostgreSQL ainsi qu'avec Redis pour la mise en cache.
