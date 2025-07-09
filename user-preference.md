# Spécifications Techniques - Persistance des Réglages Utilisateur
TU VAS commit step by step sans co auteur et sans description, tu suivera le git flow, et tu respectera l'architecture de l'application, tu ne mettra pas de commentaire inutile, tu mettra pas de description dans le commit, tu mettra pas de co auteur dans le commit, tu respectera les conventions de nommage et d'architecture, tu fera des tests unitaires et d'intégration pour chaque fonctionnalité implémentée.
## Vue d'ensemble

Ce document décrit l'architecture nécessaire pour implémenter la persistance des réglages utilisateur dans l'application Upstra. Actuellement, seuls le thème et la langue sont persistés en localStorage. Les autres paramètres sont perdus à chaque rechargement.

## Paramètres à Persister

### 1. Préférences Personnelles
- **Langue** (`locale`): 'fr' | 'en' *(déjà persisté en localStorage)*
- **Thème** (`theme`): 'light' | 'dark' *(déjà persisté en localStorage)*
- **Fuseau horaire** (`timezone`): string (ex: 'UTC', 'Europe/Paris')

### 2. Notifications
- **Notifications serveur** (`serverNotifications`): boolean
- **Notifications UPS** (`upsNotifications`): boolean
- **Notifications email** (`emailNotifications`): boolean
- **Notifications push** (`pushNotifications`): boolean

### 3. Préférences d'Affichage
- **Vue par défaut utilisateurs** (`defaultUserView`): 'table' | 'card'
- **Vue par défaut serveurs** (`defaultServerView`): 'grid' | 'list'
- **Mode compact** (`compactMode`): boolean

### 4. Intégrations
- **Webhook Slack** (`slackWebhook`): string | null
- **Email d'alerte** (`alertEmail`): string | null
- **Webhook Discord** (`discordWebhook`): string | null
- **Webhook Teams** (`teamsWebhook`): string | null

### 5. Performance
- **Rafraîchissement automatique** (`autoRefresh`): boolean
- **Intervalle de rafraîchissement** (`refreshInterval`): number (15-300 secondes)

## Architecture Backend

### Entité UserPreferences

```typescript
interface UserPreferences {
  id: string;
  userId: string;
  
  // Préférences personnelles
  locale: 'fr' | 'en';
  theme: 'light' | 'dark';
  timezone: string;
  
  // Notifications
  notifications: {
    server: boolean;
    ups: boolean;
    email: boolean;
    push: boolean;
  };
  
  // Affichage
  display: {
    defaultUserView: 'table' | 'card';
    defaultServerView: 'grid' | 'list';
    compactMode: boolean;
  };
  
  // Intégrations
  integrations: {
    slackWebhook?: string;
    alertEmail?: string;
    discordWebhook?: string;
    teamsWebhook?: string;
  };
  
  // Performance
  performance: {
    autoRefresh: boolean;
    refreshInterval: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Relation avec User

- Relation One-to-One avec l'entité User
- Création automatique lors de la création d'un utilisateur avec valeurs par défaut
- Cascade delete lors de la suppression d'un utilisateur

## Endpoints API

### 1. Récupérer les préférences utilisateur
```
GET /api/users/me/preferences
```

**Réponse:**
```json
{
  "locale": "fr",
  "theme": "dark",
  "timezone": "Europe/Paris",
  "notifications": {
    "server": true,
    "ups": true,
    "email": false,
    "push": true
  },
  "display": {
    "defaultUserView": "table",
    "defaultServerView": "grid",
    "compactMode": false
  },
  "integrations": {
    "slackWebhook": "https://hooks.slack.com/...",
    "alertEmail": "admin@example.com",
    "discordWebhook": null,
    "teamsWebhook": null
  },
  "performance": {
    "autoRefresh": true,
    "refreshInterval": 60
  }
}
```

### 2. Mettre à jour les préférences utilisateur
```
PATCH /api/users/me/preferences
```

**Corps de la requête:** (mise à jour partielle supportée)
```json
{
  "timezone": "America/New_York",
  "notifications": {
    "email": true
  },
  "display": {
    "compactMode": true
  }
}
```

**Réponse:**
- Code 200 avec les préférences mises à jour
- Code 400 si validation échoue
- Code 401 si non authentifié

### 3. Réinitialiser les préférences
```
POST /api/users/me/preferences/reset
```

**Réponse:**
- Code 200 avec les préférences par défaut

## Valeurs par Défaut

```typescript
const DEFAULT_PREFERENCES = {
  locale: 'fr',
  theme: 'dark',
  timezone: 'UTC',
  notifications: {
    server: true,
    ups: true,
    email: false,
    push: true
  },
  display: {
    defaultUserView: 'table',
    defaultServerView: 'grid',
    compactMode: false
  },
  integrations: {
    slackWebhook: null,
    alertEmail: null,
    discordWebhook: null,
    teamsWebhook: null
  },
  performance: {
    autoRefresh: true,
    refreshInterval: 60
  }
};
```

## Stratégie de Migration

### Phase 1: Migration des données existantes
1. Créer la table `user_preferences` dans la base de données
2. Pour chaque utilisateur existant, créer une entrée avec les valeurs par défaut
3. Si l'utilisateur a des préférences en localStorage (theme/locale), les récupérer lors de la première connexion

### Phase 2: Synchronisation Frontend/Backend
1. Au chargement de l'app, récupérer les préférences depuis l'API
2. Stocker en Pinia store pour accès rapide
3. Synchroniser avec le backend à chaque modification
4. Garder theme et locale en localStorage pour performance (cache local)

## Considérations de Sécurité

### Validation des Données
- **Webhooks**: Valider les URLs (format, protocole HTTPS)
- **Email**: Valider le format email
- **Intervalle**: Limiter entre 15 et 300 secondes
- **Timezone**: Valider contre une liste de fuseaux horaires valides

### Permissions
- Un utilisateur ne peut modifier que ses propres préférences
- Les admins peuvent voir mais pas modifier les préférences des autres
- Les webhooks sont chiffrés en base de données

### Limites
- Taille maximale pour les URLs de webhook: 500 caractères
- Un seul webhook par service (Slack, Discord, Teams)
- Rate limiting sur l'endpoint de mise à jour: 10 requêtes/minute

## Implémentation Frontend

### 1. Store Pinia pour les préférences

```typescript
// src/features/settings/store.ts
export const useUserPreferencesStore = defineStore('userPreferences', {
  state: () => ({
    preferences: null as UserPreferences | null,
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchPreferences() {
      // GET /api/users/me/preferences
    },
    
    async updatePreferences(updates: Partial<UserPreferences>) {
      // PATCH /api/users/me/preferences
      // Mise à jour optimiste + rollback en cas d'erreur
    },
    
    async resetPreferences() {
      // POST /api/users/me/preferences/reset
    }
  }
});
```

### 2. Composable pour l'accès aux préférences

```typescript
// src/features/settings/composables/usePreferences.ts
export function usePreferences() {
  const store = useUserPreferencesStore();
  
  return {
    preferences: computed(() => store.preferences),
    updatePreference: (key: string, value: any) => {
      // Helper pour mise à jour d'une préférence spécifique
    },
    // ...
  };
}
```

### 3. Migration progressive
- Continuer à lire theme/locale depuis localStorage en fallback
- Synchroniser avec le backend progressivement
- Migrer les composants un par un

## Tests

### Tests Backend
- Tests unitaires pour la validation des préférences
- Tests d'intégration pour les endpoints
- Tests de sécurité pour les webhooks

### Tests Frontend
- Tests unitaires pour le store Pinia
- Tests de composants pour SettingsView
- Tests E2E pour le flux complet de modification

## Monitoring

- Logger les modifications de préférences (sans les valeurs sensibles)
- Métriques sur les préférences les plus utilisées
- Alertes en cas d'échec de synchronisation

## Évolutions Futures

1. **Export/Import de préférences**
   - Permettre aux utilisateurs d'exporter leurs réglages
   - Importer des réglages depuis un fichier JSON

2. **Profils de préférences**
   - Plusieurs profils par utilisateur (travail/maison)
   - Changement rapide de profil

3. **Préférences par appareil**
   - Différentes préférences selon l'appareil utilisé
   - Synchronisation sélective

4. **Préférences d'équipe**
   - Partage de certains réglages au niveau équipe
   - Templates de préférences pour nouveaux utilisateurs