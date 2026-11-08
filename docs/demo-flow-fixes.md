# Correctifs du parcours démo (branche `flow`)

_Session des 06–08/11/2026. Bugs relevés en rejouant le parcours complet sur la stack démo (`infra-control_stack/docker-compose.demo.yml`), base vide, seed `demo-seed.json` importé dans le wizard._

## Résumé

| Branche (mergée en `--no-ff` dans `flow`) | Contenu |
|---|---|
| `fix/demo-flow` | Port vCenter, ping des noms d'hôte, états `UP`/`DOWN`, relance de découverte, état des hôtes pour la migration, images Docker |
| `feature/system-health` | Widget santé (GitHub remplacé par 4 vrais checks), totaux des releases |
| `fix/demo-walkthrough` | vCenter sans priorité, découverte via le vCenter depuis la page serveurs |

Commits signés `James ABIB`, sans co-auteur, conventional commits en anglais. Les correctifs côté front, `ups_manager`, stack et `mock_vcsim` sont décrits dans le `docs/demo-flow-fixes.md` de chaque repo.

## Correctifs

### Port du vCenter codé en dur à 443
- **Symptôme** : impossible de joindre un vCenter qui n'écoute pas sur 443.
- **Correctif** : `extractPortFromAdminUrl(adminUrl, 443)` (`vmware-connection.service.ts`) lit le port dans l'URL d'administration du serveur ; 443 reste la valeur par défaut. Utilisé par la connexion VMware, `list-vms`, `get-vm-metrics`, `migrate-vm`, la génération du plan YAML, le cache de métriques et le bulk-create avec découverte.
- La découverte au setup rattache aussi les ESXi découverts **par nom** quand l'IP ne correspond pas (vcsim renvoie `0.0.0.0`), puis par ordre en dernier recours.

### Le ping du wizard refusait les noms d'hôte
- **Symptôme** : à l'étape Révision, tous les équipements démo étaient « injoignables ».
- **Cause** : `BulkValidationUseCase.pingHost` exigeait une IP (`isIP`) ; `mock-ilo-1`, `vcsim` ou `http://mock-ups:8000` étaient rejetés d'office.
- **Correctif** : `toPingTarget` accepte IP, nom d'hôte RFC 1123 ou URL (on ping la partie hôte). Une entrée qui commence par `-` est refusée (pas d'injection d'option dans `ping`). Les pings partent **en parallèle**.

### États serveur `active` / `inactive` au lieu de `UP` / `DOWN`
- **Symptôme** : les serveurs du wizard apparaissaient « éteints » côté onduleur alors qu'ils étaient allumés côté serveurs.
- **Cause** : le dialogue du wizard enregistrait `active`/`inactive`, le reste de l'app lit `UP`/`DOWN`.
- **Correctif** : `normalizeServerState` dans `bulk-create.use-case.ts` (accepte aussi `stopped`, `off`, `poweredOff`…). Le champ `state` du DTO devient **optionnel** (`UP` par défaut ; le front le déduit maintenant du ping).
- **Migration** `1762459200000-NormalizeServerState` : remet au propre les valeurs déjà en base.

### Relance de découverte avec un mauvais identifiant
- **Symptôme** : « Failed to start discovery » au clic sur Réessayer.
- **Cause** : le front faisait `parseInt` sur un UUID (`39b2…` → `39`), le back typait `serverIds: number[]`.
- **Correctif** : `serverIds: string[]` dans le contrôleur et `StartVMDiscoveryUseCase`.

### État des hôtes faux sur la page migration
- **Cause** : `GetServerStatusUseCase` lisait l'ancien cache `metrics:metrics` (vide en démo) puis interrogeait l'ESXi en direct avec un MOID issu du vCenter, sur le port 443 en dur.
- **Correctif** : lecture d'abord dans le cache de télémétrie Pulse (`vmware:host:<moid>`, alimenté via le vCenter), repli sur l'ancien chemin avec le port de l'`adminUrl`.

### Validation en 400 et création impossible avec un vCenter sans priorité
- **Symptômes** : `POST /setup/validate` → 400 `Invalid value 'undefined' for field 'priority'` (le ping automatique du wizard ne s'affichait plus), puis `bulk-create-with-discovery` → `null value in column "priority"`.
- **Cause** : le DTO autorise un vCenter sans priorité, mais la validation interrogeait le repository avec `priority: undefined` et la colonne est `NOT NULL`.
- **Correctif** : la vérification d'unicité ignore les serveurs sans priorité ; `assignMissingPriorities` leur donne le premier rang libre **après** toutes les priorités existantes (lot + base). Le vCenter pilote l'arrêt des ESXi, il passe donc en dernier. C'est ce qui donnait « vCenter et esxi-01 en priorité 1 ».

### Découverte depuis la page serveurs : échec sur chaque ESXi
- **Cause** : `StartVMDiscoveryUseCase` interrogeait chaque ESXi directement ; en démo leurs adresses sont les mocks iLO, et en production les identifiants ESXi ne sont pas toujours ouverts à l'API VIM.
- **Correctif** : s'il existe un vCenter, découverte **via le vCenter** (comme le wizard), avec tous les ESXi pour rattacher les VMs ; sinon, repli ESXi par ESXi.

### Page d'une salle : « Aucun serveur dans cette salle » pour l'admin
- **Cause** : `GetRoomByIdUseCase` filtre les serveurs selon les permissions serveur des rôles de l'utilisateur. Le bulk-create du wizard ne crée aucune permission serveur (contrairement à la création unitaire), donc l'admin recevait une liste vide ; la liste réapparaissait seulement après un enregistrement de seuil (réponse non filtrée).
- **Correctif** : un rôle `isAdmin` voit tous les serveurs de la salle, comme sur les endpoints serveurs.

## Nouveautés

### Widget « Santé du système »
Le check GitHub (utile seulement à la page Releases) est supprimé. Les composants sont maintenant :

| Clé | Ce qui est vérifié | Statut |
|---|---|---|
| `database` | PostgreSQL répond | critique |
| `redis` | Redis répond | critique |
| `system` | RAM / disque de l'hôte qui fait tourner Upstra | |
| `python` | Le venv `ups_manager` démarre et charge `pyVmomi`, `requests`, `yaml` (résultat mis en cache 60 s) | |
| `vcenter` | Fraîcheur du snapshot vCenter (`vmware:metrics:collectedAt`) : périmé au-delà de 3 collectes manquées ; `unknown` si aucun vCenter | |
| `ups` | Une lecture batterie de moins de 3 min pour chaque UPS configuré ; nomme les UPS en retard ; `unknown` si aucun UPS | |
| `prometheus` | `GET $PROMETHEUS_URL/-/ready` | |

Seuls `database` et `redis` font passer le statut global à `down` ; les autres le dégradent. Le widget du dashboard reçoit une `key` stable (traduite côté front) et un `detail` (âge du snapshot, UPS en retard…).

### Totaux des releases
`GET /releases` renvoie aussi `stats: { releases, features, fixes }`, calculés sur **toutes** les releases des deux repos (pas seulement la page) en lisant les notes de version : sections « Features » / « Bug Fixes » et lignes `feat:` / `fix:`. Remplace les « 100+ / 500+ » codés en dur.

### Images Docker
`Dockerfile` : caches BuildKit pour `pnpm` et `pip` (rebuilds nettement plus rapides). `Dockerfile.demo` + `.dockerignore` ajoutés.

## Tests

- Nouveaux specs : `normalize-server-state`, `assign-missing-priorities`, `start-vm-discovery.use-case`, `telemetry-health.services`, `release-stats` ; specs mis à jour pour `bulk-validation`, `bulk-create.dto`, `get-health-status`, `get-system-health`, `get-releases`, `dashboard-widget.controller`.
- Suites touchées : toutes vertes.
- **Échecs préexistants, non traités** : 15 suites de `setup`, `ilos` et `vmware` échouaient déjà sur `flow` avant cette session (notamment `bulk-create.dto.spec` « invalid IP » depuis le passage `@IsIP` → `@IsString`). Elles sont à reprendre à part.

## Vérifié dans la démo

Base vide → wizard → import du seed → ping auto « Connecté » partout → application → découverte via vCenter : 19 VMs, MOIDs résolus, états `UP`, vCenter en priorité 5 → widget santé 100 % → onduleur : 3 serveurs « Allumé » → migration : hôtes en ligne.

## Reste à faire

- Page migration : les hôtes affichent « Aucune salle » au lieu de leur salle.
- Les 15 suites en échec citées plus haut.
