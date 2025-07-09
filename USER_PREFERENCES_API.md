# API User Preferences - Documentation Frontend

## Vue d'ensemble

Un nouveau module de gestion des préférences utilisateur a été implémenté côté backend. Ce module permet de persister toutes les préférences utilisateur en base de données (au lieu du localStorage uniquement).

## Endpoints API

### 1. Récupérer les préférences utilisateur

```
GET /api/user/me/preferences
```

**Headers requis:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Réponse (200 OK):**
```typescript
{
  id: string;
  userId: string;
  locale: 'fr' | 'en';
  theme: 'light' | 'dark';
  timezone: string; // ex: 'Europe/Paris'
  notifications: {
    server: boolean;
    ups: boolean;
    email: boolean;
    push: boolean;
  };
  display: {
    defaultUserView: 'table' | 'card';
    defaultServerView: 'grid' | 'list';
    compactMode: boolean;
  };
  integrations: {
    slackWebhook?: string;
    alertEmail?: string;
    discordWebhook?: string;
    teamsWebhook?: string;
  };
  performance: {
    autoRefresh: boolean;
    refreshInterval: number; // 15-300 secondes
  };
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
```

**Note:** Si l'utilisateur n'a pas encore de préférences, elles seront créées automatiquement avec les valeurs par défaut.

### 2. Mettre à jour les préférences utilisateur

```
PATCH /api/user/me/preferences
```

**Headers requis:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body (mise à jour partielle supportée):**
```typescript
{
  locale?: 'fr' | 'en';
  theme?: 'light' | 'dark';
  timezone?: string;
  notifications?: {
    server?: boolean;
    ups?: boolean;
    email?: boolean;
    push?: boolean;
  };
  display?: {
    defaultUserView?: 'table' | 'card';
    defaultServerView?: 'grid' | 'list';
    compactMode?: boolean;
  };
  integrations?: {
    slackWebhook?: string;
    alertEmail?: string;
    discordWebhook?: string;
    teamsWebhook?: string;
  };
  performance?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
  };
}
```

**Réponse (200 OK):** Même structure que GET

**Erreurs possibles:**
- 400: Données invalides (timezone invalide, URL webhook non HTTPS, interval hors limites, etc.)
- 401: Non authentifié

### 3. Réinitialiser les préférences

```
POST /api/user/me/preferences/reset
```

**Headers requis:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Réponse (200 OK):** Préférences réinitialisées aux valeurs par défaut

## Valeurs par défaut

```typescript
{
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
  integrations: {}, // Toutes les intégrations sont optionnelles
  performance: {
    autoRefresh: true,
    refreshInterval: 60
  }
}
```

## Validations importantes

### Timezone
Les timezones doivent faire partie de la liste supportée :
- UTC
- Europe/Paris, Europe/London, Europe/Berlin, etc.
- America/New_York, America/Los_Angeles, etc.
- Asia/Tokyo, Asia/Shanghai, etc.
- Australia/Sydney, Australia/Melbourne
- Voir la liste complète dans le code backend

### Webhooks
- Doivent être des URLs HTTPS valides
- Longueur maximale : 500 caractères
- Pour supprimer un webhook, envoyer une chaîne vide ""

### Intervalle de rafraîchissement
- Minimum : 15 secondes
- Maximum : 300 secondes (5 minutes)

### Email d'alerte
- Doit être un format email valide

## Recommandations pour l'implémentation Frontend

### 1. Store Pinia

```typescript
// stores/userPreferences.ts
export const useUserPreferencesStore = defineStore('userPreferences', {
  state: () => ({
    preferences: null as UserPreferences | null,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchPreferences() {
      // GET /api/user/me/preferences
    },

    async updatePreferences(updates: Partial<UserPreferences>) {
      // PATCH /api/user/me/preferences
      // Mise à jour optimiste recommandée
    },

    async resetPreferences() {
      // POST /api/user/me/preferences/reset
    }
  }
})
```

### 2. Types TypeScript

```typescript
// types/userPreferences.ts
export interface UserPreferences {
  id: string;
  userId: string;
  locale: 'fr' | 'en';
  theme: 'light' | 'dark';
  timezone: string;
  notifications: NotificationPreferences;
  display: DisplayPreferences;
  integrations: IntegrationPreferences;
  performance: PerformancePreferences;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  server: boolean;
  ups: boolean;
  email: boolean;
  push: boolean;
}

export interface DisplayPreferences {
  defaultUserView: 'table' | 'card';
  defaultServerView: 'grid' | 'list';
  compactMode: boolean;
}

export interface IntegrationPreferences {
  slackWebhook?: string;
  alertEmail?: string;
  discordWebhook?: string;
  teamsWebhook?: string;
}

export interface PerformancePreferences {
  autoRefresh: boolean;
  refreshInterval: number;
}
```

### 3. Service API

```typescript
// services/userPreferences.api.ts
import { api } from '@/services/api';
import type { UserPreferences, UpdateUserPreferencesDto } from '@/types/userPreferences';

export const userPreferencesApi = {
  getPreferences(): Promise<UserPreferences> {
    return api.get('/user/me/preferences');
  },

  updatePreferences(updates: UpdateUserPreferencesDto): Promise<UserPreferences> {
    return api.patch('/user/me/preferences', updates);
  },

  resetPreferences(): Promise<UserPreferences> {
    return api.post('/user/me/preferences/reset');
  }
};
```

## Notes importantes

1. **Migration progressive** : Continuez à utiliser localStorage pour theme/locale en fallback pendant la transition
2. **Cache local** : Stockez les préférences dans le store Pinia pour éviter des appels API répétés
3. **Synchronisation** : Synchronisez avec le backend lors de chaque modification
4. **Gestion d'erreurs** : En cas d'échec API, gardez les valeurs locales
5. **Première connexion** : Les préférences sont créées automatiquement lors du premier GET

## Prochaines étapes

Pour l'instant, créez uniquement :
1. Le store Pinia
2. Les types TypeScript
3. Le service API

La liaison avec les composants Vue et la migration depuis localStorage seront traitées dans une prochaine étape.