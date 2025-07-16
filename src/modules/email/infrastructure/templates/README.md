# Email Templates Documentation

## Templates disponibles

### 1. account-created.hbs
Email de bienvenue envoyé lors de la création d'un compte.

**Variables requises :**
- `{{prenom}}` - Prénom de l'utilisateur
- `{{email}}` - Email de l'utilisateur
- `{{loginUrl}}` - URL de connexion à l'application

### 2. password-changed.hbs
Notification envoyée lors d'un changement de mot de passe.

**Variables requises :**
- `{{prenom}}` - Prénom de l'utilisateur
- `{{email}}` - Email de l'utilisateur
- `{{changeDate}}` - Date du changement (format: JJ/MM/AAAA)
- `{{changeTime}}` - Heure du changement (format: HH:MM)
- `{{loginUrl}}` - URL de connexion à l'application
- `{{ipAddress}}` - Adresse IP d'où la modification a été effectuée
- `{{userAgent}}` - Navigateur utilisé
- `{{location}}` - Localisation approximative

### 3. reset-password.hbs
Email de réinitialisation de mot de passe.

**Variables requises :**
- `{{prenom}}` - Prénom de l'utilisateur
- `{{email}}` - Email de l'utilisateur
- `{{requestDate}}` - Date de la demande (format: JJ/MM/AAAA)
- `{{requestTime}}` - Heure de la demande (format: HH:MM)

**Variables conditionnelles :**
- `{{resetCode}}` - Code de réinitialisation (si utilisé)
- `{{resetLink}}` - Lien de réinitialisation (si utilisé)

## Design System

Les templates suivent le design system de l'application :

### Couleurs
- **Primary** : #2563EB (Bleu acier)
- **Primary Dark** : #1E3A8A
- **Success** : #10B981 (Vert)
- **Warning** : #F59E0B (Orange)
- **Neutral Light** : #F3F4F6
- **Neutral Dark** : #1F2937

### Typographie
- **Sans-serif** : -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif
- **Monospace** : 'Courier New', monospace

### Responsive
- Les templates sont optimisés pour mobile (max-width: 600px)
- Support du mode sombre via `prefers-color-scheme`

## Assets
Le logo PNG est disponible dans `/assets/upstra-logo.png`

### Configuration des URLs

Les URLs suivantes sont automatiquement ajoutées à tous les templates par le `ZohoMailAdapter` :

**Variables automatiques :**
- `{{logoUrl}}` - URL du logo Upstra (par défaut : `${APP_URL}/assets/upstra-logo.png`)
- `{{loginUrl}}` - URL de connexion à l'application (par défaut : valeur de `APP_URL`)
- `{{currentYear}}` - Année en cours pour le copyright

**Variables d'environnement :**
```bash
# URL de base de l'application (obligatoire)
APP_URL=https://votre-domaine.com

# URL personnalisée du logo (optionnel)
# Si non défini, utilise APP_URL + /assets/upstra-logo.png
MAIL_LOGO_URL=https://cdn.votre-domaine.com/logo.png
```

### Serveur de fichiers statiques
Le logo est automatiquement servi à l'URL `/assets/upstra-logo.png` grâce à la configuration dans `main.ts`.