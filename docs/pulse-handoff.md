# Refonte « Pulse » : où on en est

_Mis à jour le 04/11/2026, fin de session. Note de passation, à supprimer une fois les briefs terminés._

## Résumé express

| # | Brief | État | Vérifié de bout en bout |
|---|---|---|---|
| 01 | Télémétrie onduleur | ✅ Fini, poussé | ✅ back + mock_ups + vrai Postgres/Redis |
| 02 | Alertes + acquittement + fil | ✅ Fini, poussé | ✅ scénario coupure → alerte → retour secteur |
| 03 | Métriques VMware + événements vCenter | ✅ Fini, poussé | ✅ contre vcsim (arrêt manuel, compte Upstra, hôte déconnecté) |
| 04 | Santé iLO Redfish | ✅ Fini, poussé | ✅ back + mock_ilo en scénario maquette (PSU 2 absente, entrée d'air 31 °C, Warning, mot de passe masqué dans les logs) |
| 05 | Historique Prometheus | ✅ Fini, poussé | ✅ back + vrai Prometheus 2.55 : séries `upstra_*` réelles, `/metrics/series` à 15 s, 400 hors liste blanche |
| 06 | Dashboard, présence, puissance nominale, layouts, déplacement UPS | ✅ Fini, poussé | ✅ back + simulateurs + 2 navigateurs WebSocket simulés + rollback forcé en base |
| 07 | Durcissement sécu (4 failles) + licence AGPL-3.0 | ⏳ Pas commencé (ajouté à ta demande) | — |

## Git : branches et règles suivies

- Il n'existait **aucune `develop`** sur `infra-control`, `ups_manager`, `mock_ups` ni `mock_ilo`. Comme tu l'as demandé, je suis parti de `master`/`main`.
- Une branche `feature/*` par brief, **empilées dans l'ordre** (chacune part de la précédente).
- **Branche de recette globale `flow`** (à ta demande) : créée depuis `master`/`main` dans chaque repo back, chaque brief y est mergé en `--no-ff` dès qu'il est fini.
- Rien n'a été poussé sur `master`/`main`. Aucune PR n'a été ouverte.
- Tous les commits sont signés `James ABIB <james.bidule@gmail.com>`, **sans aucun Co-Authored-By**, messages en anglais au format conventional commits.

| Repo | Branches poussées (dans l'ordre) |
|---|---|
| `Upstra/infra-control` | `feature/ups-telemetry` → `feature/alerts` → `feature/vmware-telemetry` → `feature/ilo-health` → `feature/metrics-history` → `feature/dashboard-presence`, tout mergé dans `flow` |
| `Upstra/ups_manager` | `feature/ups-telemetry` → `feature/vmware-telemetry` → `feature/ilo-health`, tout mergé dans `flow` |
| `Upstra/mock_ups` | `feature/ups-telemetry`, mergé dans `flow` |
| `Upstra/mock_ilo` | `feature/ilo-health`, mergé dans `flow` |
| `infra-control_stack`, `infra-control_front`, `mock_vcsim` | rien touché |

## Ce qui a été fait, brief par brief

### 01 — Télémétrie onduleur
- `ups_manager` : `ups_battery.sh --format json`, avec les sources SNMP UPS-MIB, NUT (`--source nut --ups-name`) et mock HTTP. Sans le flag, l'ancien entier est conservé. Tests unitaires dans `tests/`.
- `mock_ups` : `/telemetry` au format du contrat, plus les scénarios `/scenario/on-battery`, `/scenario/online`, `overload`, `replace-battery` et `load`. La batterie se décharge **avec le temps**.
- `infra-control` :
  - interface `UpsTelemetry` et parser pur `parseUpsTelemetry` ;
  - nouveau `calculateAlertLevel(telemetry, minutes)` basé sur le **vrai** statut secteur ;
  - événements `ups.status.changed` et `ups.battery.check-failed` ;
  - `BATTERY_ALERT` n'est plus émis que si le niveau change ;
  - le faux % batterie du dashboard est supprimé ;
  - `GET /ups/:id` inclut désormais le `batteryStatus` ;
  - polling via `UPS_POLL_CRON`, qui passe automatiquement à `UPS_POLL_ON_BATTERY_SECONDS` dès qu'un onduleur est sur batterie.
- Bug corrigé au passage : le cron appelait le use case qui renvoyait le cache (TTL 300 s), donc on ne pollait en réalité que toutes les 5 min. Ajout de `forceRefresh`.

### 02 — Alertes
- Nouveau module `alerts` en DDD :
  - entités `Alert` et `AlertTransition` ;
  - migration `1762286400000-CreateAlertTables`, **validée sur un vrai Postgres 16** (up/down, diff nul) ;
  - index unique partiel `dedupKey WHERE status='open'`.
- `AlertService` :
  - `raise` / `resolve` / `acknowledge` / `unacknowledge` idempotents ;
  - une aggravation fait perdre l'acquittement ;
  - historique `ACKNOWLEDGE` / `UNACKNOWLEDGE` ;
  - chaque transition émet `alerts.transition`.
- API : `GET /alerts`, `/alerts/summary`, `/alerts/:id`, `POST /alerts/:id/(un)acknowledge` (409 si résolue, 403 sans permission), `GET /events/feed` avec curseur.
- WebSocket `/alerts` : `alert:opened|updated|resolved|acknowledged` et `alerts:summary`.
- Le mail part uniquement sur `opened`/`escalated` d'une alerte critique d'onduleur. L'ancien listener « un mail par minute » est supprimé.
- Le widget dashboard lit maintenant les vraies alertes, plus rien de codé en dur.
- Choix assumé : le fil ne prend **pas** les lignes d'historique `alert/ACKNOWLEDGE`, parce que les transitions les couvrent déjà. Sinon on aurait eu « jbidule a acquitté UPS-B2 » en double.

### 03 — VMware
- `ups_manager` :
  - `inventory_metrics.sh` : une seule session et un `PropertyCollector` par type d'objet, soit 20 VMs + 4 hôtes en 0,2 s sur vcsim ;
  - `vcenter_events.sh --since --max`, avec un filtre côté client parce que vcsim ignore le filtre serveur.
- `infra-control` :
  - `VmHealthDomainService` (up/degraded/down/unknown, CPU élevé sur 2 mesures) et `PowerOffCauseDomainService` (ha/upstra/manual) ;
  - collecte derrière un verrou Redis `SET NX EX` ;
  - curseur d'événements avec dédoublonnage ;
  - cache en masse par pipeline (`vmware:vm:*`, `vmware:host:*`) ;
  - `getVMMetrics` lit ce cache en priorité.
- API :
  - `GET /vm?includeMetrics=true` ne lance plus aucun script et ajoute `health`, `cpuPercent`, `uptimeSeconds` et `powerOff` ;
  - `GET /vm?health=issues` ;
  - `GET /server/hosts/metrics`, enregistrée avant `/server/:id`.
- WebSocket `/vmware` → `vmware:metrics` (diff seulement).
- Alertes `vm_powered_off` (critique si `priority <= VM_HIGH_PRIORITY_MAX`), `vm_heartbeat_lost`, `host_disconnected` et `host_cpu_high`.

### 04 — iLO Redfish
- `ups_manager` : `ilo_health.sh`, qui prend le premier membre de Chassis/Systems, lit Thermal/Power/Managers et accepte `http(s)://` pour le mock. Les capteurs absents sont listés mais valent `null`.
- `mock_ilo` : routes Chassis/Thermal/Power/Managers et scénarios `nominal`, `maquette` (PSU 2 absente + entrée d'air 31 °C + Warning) et `ilo4-no-inlet`.
- `infra-control` :
  - `IloHealthDomainService` : seuils de la salle, sinon ceux de Redfish, sinon 30/35 °C ; PSU dégradée ; hystérésis de 1 °C ;
  - `IloHealthScheduler` avec une concurrence limitée et un verrou ;
  - cache `ilo:health:<serverId>` ;
  - `GET /room/:id/environment` ;
  - champ `hardware` sur `GET /server` et `GET /server/:id` ;
  - colonnes `room.inletWarnC` / `inletCritC` (migration `1762286500000`, validée) ;
  - alertes d'entrée d'air, de PSU, de santé matérielle et d'iLO injoignable ;
  - agrégat global prêt pour le brief 06 (`GetHardwareEnvironmentUseCase.global()`).

### 05 — Historique Prometheus
- **Port vérifié** : en prod et sur le Raspberry, le back écoute sur 8080, donc `backend:8080` était correct. En revanche, `docker-compose.monitoring.yml` (le compose de dev) n'a pas de service `backend` : rien n'était collecté en dev. J'ai ajouté `prometheus.dev.yml`, qui vise `host.docker.internal:3000`.
- **Rétention** : 15 j en prod et en dev ; 8 j + 1 GB sur le Raspberry (7 j visibles + 1 j de marge).
- **`MetricsRegistryService`** : jauges `upstra_ups_*`, `upstra_host_*`, `upstra_server_*` et `upstra_alerts_open`, alimentées par les événements. Une valeur `null` retire la série au lieu de la mettre à 0. Les séries sont aussi retirées à la suppression d'un onduleur ou d'un serveur (nouveaux événements `ups.deleted` / `server.deleted`) ou à la disparition d'un hôte.
- **`GET /metrics/series`** :
  - la PromQL est construite côté back à partir d'une liste blanche (metric, scope, range, id validé) ;
  - pas de 15 s / 2 min / 15 min selon la plage ;
  - cache Redis de 15 s ;
  - 503 `HISTORY_UNAVAILABLE` si Prometheus est KO.
- **Découplage** : `alerts` publie `alerts.summary.changed`, que la gateway WebSocket et les métriques écoutent. `PrometheusModule` ne dépend donc plus du module `alerts`.
- **Vérifié en HTTP avec un vrai token** (briefs 01 à 05) : `/ups/:id`, `/alerts/summary`, l'acquittement (« jbidule a acquitté UPS-B2 » dans le fil, historique `ACKNOWLEDGE`, 409 sur une alerte résolue), `/room/:id/environment` (`maxInletC: 31`), `hardware` sur `/server/:id`, et `/metrics/series`.

### 06 — Dashboard, présence, puissance nominale, layouts, déplacement d'onduleur
- **Correctif important au passage :** TypeORM ne charge que `src/core/migrations` (chemin `__dirname + '/../migrations'` dans `typeorm.config.ts`). Les 19 migrations de `src/migrations` ne sont jamais jouées en prod. J'ai déplacé mes migrations (alertes, seuils de salle, brief 06) dans `src/core/migrations`, sans toucher au chemin pour ne pas rejouer `InitialSchema` sur des bases existantes. **À trancher de ton côté** pour les anciennes migrations.
- **Puissance nominale :** colonne `ups.nominalPowerW` dans les DTO de création et de modification. La valeur effective est celle remontée par l'onduleur, sinon celle saisie, sinon `null`. Elle est exposée via `effectiveNominalPowerW` et `nominalPowerSource` (`device` / `manual`).
- **KPI de `/dashboard/full` :** hôtes, santé des VMs, puissance consommée, capacité (`null` si un onduleur n'a pas de nominale), entrée d'air max avec salle et serveur, onduleurs sur batterie, alertes ouvertes. Tout est lu depuis Redis. Le résumé des alertes est mis en cache par le publisher, et les KPI ne sont pas figés par le cache de 60 s des stats de base.
- **Présence :**
  - `presence:<userId>` contient `{ route, title, lastActivityAt, connectedAt }` ;
  - statut `active` / `idle` à 2 min, avec un balayage toutes les 30 s qui pousse le passage en `idle` ;
  - nouveau `GET /presence` ;
  - la page consultée est masquée pour les comptes inactifs (même règle que `GET /user`) ;
  - un ping `active: false` maintient en ligne sans compter comme activité ;
  - doc mise à jour : `docs/presence-storage.md`.
- **Tableaux personnalisés :**
  - nouveaux types `incident`, `kpis`, `ups`, `vms`, `hosts`, `events`, `power` et `presence` ;
  - règle `x` = rang, `w` ∈ {4, 6, 8, 12} ;
  - migration de données : tri par `(y, x)`, largeur arrondie vers la valeur autorisée la plus proche (la plus petite en cas d'égalité), anciens types convertis. Validée sur Postgres, que la colonne soit un enum ou un varchar ;
  - tableau par défaut créé au premier affichage pour un nouvel utilisateur.
- **Nettoyage :** l'uptime codé en dur de `GetSystemHealthUseCase` vaut maintenant `null`. `resource-usage` reste dans l'enum du back pour les tableaux existants ; le retrait est à faire côté front.
- **Déplacement d'onduleur :** `PATCH /ups/:id` avec `moveServers`, onduleur et serveurs dans une seule transaction (rollback vérifié avec un trigger qui force l'échec), entrée d'historique avec `movedServerIds`, et la réponse renvoie les serveurs déplacés.

## Reprendre ici

1. **Brief 07 (sécu + licence).** Les 4 failles : credentials, SSL configurable (aujourd'hui `verify=False` en dur dans `ilo.py` et `vm_ware_connection.py`), timeout de 30 min, verrou Redis `SET NX` (déjà en place pour VMware et iLO, à généraliser à l'orchestrateur de migration). Puis `LICENSE` AGPL-3.0 à la racine des repos, et un README avec capture et schéma d'architecture.

## Points d'attention

- **Tests préexistants cassés sur `master` :** 51 suites et 261 tests en échec avant mon passage. Après le brief 06, on est à 49 suites et 244 tests sur 3 245, et **aucune nouvelle suite cassée**. Quelques exemples : `ups.controller.spec` (signature de `pingUps`), les specs du contrôleur serveur (dépendance `RoleGuard`), et les specs email, iLO et vmware.service.
- **`dump.rdb` dans l'historique** de `feature/vmware-telemetry` (commit `25c3173`) : c'est la sauvegarde du Redis de test, qui ne contient que des données de démo. Le force-push pour le retirer a été refusé, je l'ai donc supprimé dans le commit suivant et ajouté au `.gitignore`. Si tu veux un historique propre, il faut faire un rebase et un force-push toi-même.
- **Ports :** `VmwareConnectionService` force le port 443 (comportement existant, que je n'ai pas modifié).
- **Variables d'env ajoutées** dans `.env.prod.example` :
  - onduleurs : `UPS_POLL_CRON`, `UPS_POLL_ON_BATTERY_SECONDS` ;
  - VMware : `VMWARE_TELEMETRY_ENABLED`, `VMWARE_METRICS_INTERVAL_SECONDS`, `VMWARE_EVENTS_INTERVAL_SECONDS`, `VM_CPU_WARN_PERCENT`, `VM_HIGH_PRIORITY_MAX`, `VMWARE_SERVICE_ACCOUNT` ;
  - iLO : `ILO_HEALTH_ENABLED`, `ILO_HEALTH_INTERVAL_SECONDS`, `ILO_HEALTH_CONCURRENCY` ;
  - historique : `PROMETHEUS_URL` (défaut `http://prometheus:9090`).
- **Nouvelle dépendance :** `cron@4.3.0`, déclarée en direct. Elle était déjà présente via `@nestjs/schedule` mais pnpm ne la rendait pas accessible.
- **Front non touché :** les nouveaux champs sont tous additifs, rien n'a été retiré des DTO.
