# Spécifications Techniques - Réglages Admin / Configuration Système

## Vue d'ensemble

Ce document décrit l'architecture pour les réglages administrateur qui permettent de configurer l'application au niveau système. Ces réglages sont distincts des préférences utilisateur et affectent l'ensemble de l'application.

## Différences avec les Réglages Utilisateur

### Réglages Utilisateur (UserPreferences)
- **Portée**: Spécifique à chaque utilisateur
- **Stockage**: Table dédiée avec relation 1-1 avec User
- **Accès**: Chaque utilisateur modifie ses propres préférences
- **Impact**: Affecte uniquement l'expérience de l'utilisateur

### Réglages Admin (SystemSettings)
- **Portée**: Globale à l'application
- **Stockage**: Table unique de configuration système
- **Accès**: Réservé aux administrateurs
- **Impact**: Affecte tous les utilisateurs et le comportement système

## Architecture de Stockage

### Option 1: Table Unique avec JSON (Recommandée)
```sql
CREATE TABLE system_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT 'singleton',
  settings JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(36) REFERENCES users(id)
);
```

**Avantages:**
- Flexibilité pour ajouter/modifier des paramètres
- Une seule ligne dans la base
- Facile à cacher en mémoire
- Migration simple

### Option 2: Table Key-Value
```sql
CREATE TABLE system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json'
  category VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(36) REFERENCES users(id)
);
```

**Avantages:**
- Audit granulaire par paramètre
- Possibilité de permissions par clé
- Historique des changements facile

## Entité SystemSettings

```typescript
interface SystemSettings {
  id: string; // Singleton ID
  
  // Sécurité
  security: {
    registrationEnabled: boolean;
    requireEmailVerification: boolean;
    defaultUserRole: string;
    sessionTimeout: number; // secondes
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    allowGuestAccess: boolean;
  };
  
  // Système
  system: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    maxUploadSize: number; // MB
    allowedFileTypes: string[];
    api: {
      enabled: boolean;
      rateLimit: number; // requêtes/minute
    };
    enableWebSockets: boolean;
  };
  
  // Email
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password?: string; // Chiffré
    };
    from: {
      name: string;
      address: string;
    };
  };
  
  // Sauvegardes
  backup: {
    enabled: boolean;
    schedule: {
      interval: number; // heures
      retention: number; // jours
    };
    storage: {
      type: 'local' | 's3' | 'azure';
      path?: string;
      credentials?: Record<string, string>; // Chiffré
    };
  };
  
  // Journalisation
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    retention: number; // jours
    metrics: {
      enabled: boolean;
      retention: number; // jours
    };
  };
  
  updatedAt: Date;
  updatedBy: string; // User ID
}
```

## Endpoints API

### 1. Récupérer les réglages système
```
GET /api/admin/settings
```

**Permissions**: Admin uniquement

**Réponse:**
```json
{
  "security": {
    "registrationEnabled": true,
    "requireEmailVerification": false,
    "defaultUserRole": "user",
    "sessionTimeout": 3600,
    "maxLoginAttempts": 5,
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSpecialChars": false
    },
    "allowGuestAccess": false
  },
  "system": { ... },
  "email": { ... },
  "backup": { ... },
  "logging": { ... }
}
```

### 2. Mettre à jour les réglages système
```
PATCH /api/admin/settings
```

**Permissions**: Admin uniquement

**Corps de la requête:** (mise à jour partielle)
```json
{
  "security": {
    "registrationEnabled": false
  },
  "system": {
    "maintenanceMode": true,
    "maintenanceMessage": "Maintenance en cours"
  }
}
```

**Réponse:**
- Code 200 avec les réglages mis à jour
- Code 403 si non-admin
- Code 400 si validation échoue

### 3. Réinitialiser une catégorie
```
POST /api/admin/settings/{category}/reset
```

**Catégories**: security, system, email, backup, logging

**Réponse:**
- Code 200 avec les valeurs par défaut de la catégorie

### 4. Tester la configuration email
```
POST /api/admin/settings/email/test
```

**Corps:**
```json
{
  "to": "test@example.com"
}
```

### 5. Exporter/Importer la configuration
```
GET /api/admin/settings/export
POST /api/admin/settings/import
```

## Valeurs par Défaut

```typescript
const DEFAULT_SYSTEM_SETTINGS = {
  security: {
    registrationEnabled: true,
    requireEmailVerification: false,
    defaultUserRole: 'user',
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    },
    allowGuestAccess: false
  },
  system: {
    maintenanceMode: false,
    maintenanceMessage: '',
    maxUploadSize: 10,
    allowedFileTypes: ['jpg', 'png', 'pdf', 'docx'],
    api: {
      enabled: true,
      rateLimit: 100
    },
    enableWebSockets: true
  },
  email: {
    enabled: false,
    smtp: {
      host: '',
      port: 587,
      secure: true,
      user: ''
    },
    from: {
      name: 'Upstra',
      address: 'noreply@upstra.io'
    }
  },
  backup: {
    enabled: false,
    schedule: {
      interval: 24,
      retention: 30
    },
    storage: {
      type: 'local'
    }
  },
  logging: {
    level: 'info',
    retention: 7,
    metrics: {
      enabled: true,
      retention: 30
    }
  }
};
```

## Cache et Performance

### Stratégie de Cache
1. **Cache en mémoire** au niveau API (Redis/In-Memory)
2. **Invalidation** lors des mises à jour
3. **TTL**: 5 minutes (compromis entre performance et fraîcheur)
4. **Broadcast** des changements via WebSocket aux instances

### Implémentation
```typescript
class SystemSettingsService {
  private cache: SystemSettings | null = null;
  private cacheExpiry: Date | null = null;
  
  async getSettings(): Promise<SystemSettings> {
    if (this.cache && this.cacheExpiry > new Date()) {
      return this.cache;
    }
    
    const settings = await this.repository.findOne();
    this.cache = settings;
    this.cacheExpiry = new Date(Date.now() + 5 * 60 * 1000);
    
    return settings;
  }
  
  async updateSettings(updates: Partial<SystemSettings>) {
    // Update DB
    await this.repository.update(updates);
    
    // Invalidate cache
    this.cache = null;
    
    // Broadcast change
    this.eventEmitter.emit('settings.updated', updates);
  }
}
```

## Sécurité

### Chiffrement des Données Sensibles
- Mots de passe SMTP
- Clés API externes
- Credentials de stockage

### Audit Trail
```typescript
interface SettingsAuditLog {
  id: string;
  userId: string;
  timestamp: Date;
  category: string;
  changes: {
    path: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress: string;
}
```

### Validation Stricte
- URLs webhook validées
- Ports dans plages autorisées
- Types de fichiers sécurisés
- Limites raisonnables

## Impacts sur l'Application

### Mode Maintenance
- Middleware qui vérifie `maintenanceMode`
- Redirige vers page de maintenance
- Bypass pour les admins

### Politique de Mots de Passe
- Validation lors de l'inscription
- Validation lors du changement
- Messages d'erreur détaillés

### Limites API
- Rate limiting middleware
- Headers de limite dans les réponses
- Gestion du quota

## Migration et Déploiement

### Phase 1: Infrastructure
1. Créer la table `system_settings`
2. Insérer les valeurs par défaut
3. Créer les endpoints API

### Phase 2: Migration des Valeurs
1. Si des configs existent en variables d'environnement, les migrer
2. Valider toutes les valeurs migrées
3. Activer le nouveau système

### Phase 3: Interface Admin
1. Déployer l'interface de configuration
2. Former les administrateurs
3. Documenter les paramètres

## Monitoring

### Métriques à Suivre
- Fréquence des changements par catégorie
- Temps de réponse avec/sans cache
- Erreurs de validation
- Utilisation des fonctionnalités activées/désactivées

### Alertes
- Mode maintenance activé > 24h
- Échec des sauvegardes
- Taux d'erreur email élevé
- Changements critiques de sécurité

## Différences Clés avec UserPreferences

| Aspect | UserPreferences | SystemSettings |
|--------|----------------|----------------|
| Portée | Par utilisateur | Globale |
| Accès | Utilisateur lui-même | Admins seulement |
| Stockage | 1 ligne par user | 1 ligne singleton |
| Cache | Store Pinia | Cache serveur + broadcast |
| Validation | Légère | Stricte avec impacts système |
| Audit | Optionnel | Obligatoire |
| Backup | Avec profil user | Critical, backup séparé |

## Évolutions Futures

1. **Configuration par Environnement**
   - Dev/Staging/Prod différents
   - Héritage de configurations

2. **Gestion des Features Flags**
   - Activation progressive de fonctionnalités
   - A/B testing au niveau système

3. **Configuration Multi-Tenant**
   - Si évolution vers SaaS
   - Paramètres par organisation

4. **API de Configuration**
   - Webhooks pour changements
   - SDK pour intégrations tierces