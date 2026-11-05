# Refonte « Pulse » : ce que le backend expose pour le frontend

Ce document liste tout ce que le backend `infra-control` propose depuis la refonte Pulse : REST, WebSocket, formats exacts, cas d'erreur. Il sert de référence à l'agent frontend qui implémente le nouveau flow.

- **Branche à utiliser côté back** : `flow` (repos `infra-control`, `ups_manager`, `mock_ups`, `mock_ilo`).
- **Swagger** : `http://localhost:3000/docs`, avec tous les DTO ci-dessous.
- **Auth** : inchangée. JWT en `Authorization: Bearer <token>` sur toutes les routes REST citées. Les sockets passent le token dans `auth: { token }` au handshake, comme aujourd'hui.

## 0. Règles à respecter partout

1. **Une donnée matérielle peut valoir `null`.** Un champ que l'équipement ne fournit pas vaut `null`, jamais 0 ni une valeur calculée. **Le front affiche « — »**, il ne remplace jamais par 0 et ne recalcule rien.
2. **Tous les changements sont additifs.** Aucun champ existant n'a été retiré ni renommé. Seule exception : `uptime` du widget santé système vaut maintenant `null` (voir §7.3).
3. **Unités :**
   - `runtimeSeconds` est en **secondes**, `minutesRemaining` en **minutes**, les températures en °C, les puissances en W ;
   - les points d'historique sont `[timestampMs, valeur]` (millisecondes) ;
   - les dates sont en ISO 8601.
4. **Statuts de santé normalisés :** VMs et hôtes utilisent toujours `up | degraded | down | unknown`. Les alertes utilisent `critical | warning | info`.
5. **Libellés :** les titres et messages d'alerte et du fil sont **déjà rédigés en français** par le back. Les afficher tels quels.

---

## 1. Onduleurs : télémétrie complète

### 1.1 Ce qui change pour l'UI

- **Le statut secteur/batterie vient de l'onduleur** (`onBattery`). Il ne se déduit plus de l'autonomie. Un onduleur sur secteur avec 25 min d'autonomie n'est **jamais** « sur batterie ».
- **Le % batterie vient de l'onduleur** (`batteryPercentage`). Le back ne l'invente plus à partir des minutes. **Le front ne doit pas le recalculer non plus.**
- Pendant une coupure, le back interroge les onduleurs toutes les **15 s** au lieu d'une fois par minute. Les sockets arrivent donc plus vite.

### 1.2 Endpoints

| Méthode | Route | Notes |
|---|---|---|
| GET | `/ups?page=&limit=` | Liste paginée. Chaque item a `batteryStatus` (lu depuis le cache, peut être absent) |
| GET | `/ups/:id` | **Nouveau** : inclut aussi `batteryStatus` |
| GET | `/ups/battery/:upsId` | Statut batterie seul (cache, sinon lecture immédiate) |
| GET | `/ups/battery/status?page=&limit=` | Statuts paginés |
| POST | `/ups` | Accepte `nominalPowerW` (optionnel) |
| PATCH | `/ups/:id` | Accepte `nominalPowerW` et `moveServers` (voir §1.5) |

### 1.3 `batteryStatus` (`BatteryStatusResponseDto`)

```jsonc
{
  "upsId": "uuid",
  "ip": "http://mock-ups:8000",
  "minutesRemaining": 14,          // number | null
  "hoursRemaining": 0.23,          // number | null
  "alertLevel": "warning",         // normal | low | warning | critical
  "statusLabel": "Sur batterie - Préparer shutdown",
  "timestamp": "2026-11-04T20:01:44.000Z",
  "onBattery": true,               // NOUVEAU — boolean | null (null = statut secteur inconnu, ancien script)
  "batteryPercentage": 38,         // NOUVEAU — number | null
  "loadPercent": 61,               // NOUVEAU — number | null
  "telemetry": { … }               // NOUVEAU — UpsTelemetry | null (null = ancien script ups_manager)
}
```

Valeurs possibles de `statusLabel` :
- `Sur secteur`
- `Sur secteur - Surcharge`
- `Sur secteur - Batterie à remplacer`
- `Sur batterie`
- `Sur batterie - Préparer shutdown`
- `Sur batterie - Critique, action immédiate requise`
- `Statut secteur inconnu - …` (ancien script : c'est là que l'UI peut afficher « Statut secteur inconnu »)

### 1.4 `telemetry` (`UpsTelemetry`)

```jsonc
{
  "source": "nut",                                  // nut | snmp | http
  "collectedAt": "2026-11-04T20:01:44.000Z",
  "device": { "manufacturer": "APC", "model": "Smart-UPS SRT 3000", "serial": null, "firmware": null },
  "status": {
    "raw": "OB DISCHRG",
    "onBattery": true, "lowBattery": false, "charging": false,
    "onBypass": false, "overload": false, "replaceBattery": false   // tous boolean | null
  },
  "battery": {
    "chargePercent": 38, "runtimeSeconds": 840, "voltage": null,
    "temperatureC": null, "lastTestResult": null, "lastTestAt": null
  },
  "input":  { "voltage": 0,   "frequencyHz": null },
  "output": { "voltage": 230, "frequencyHz": 50 },
  "load":   { "percent": 61, "realPowerW": 1840, "nominalRealPowerW": 3000 },
  "temperatureC": 31
}
```

Ce qu'affiche la maquette, champ par champ :

| Élément UI | Champ |
|---|---|
| Anneau batterie | `batteryPercentage` (ou `telemetry.battery.chargePercent`) |
| Autonomie | `minutesRemaining` (ou `telemetry.battery.runtimeSeconds`) |
| Statut | `onBattery`, `statusLabel` |
| Charge | `loadPercent`, `telemetry.load.realPowerW` |
| Tensions | `telemetry.input.voltage`, `telemetry.output.voltage` |
| Température | `telemetry.temperatureC` |
| Modèle | `telemetry.device` |

### 1.5 Puissance nominale et déplacement de salle

Nouveaux champs sur **toutes** les réponses onduleur (`UpsResponseDto`) :

```jsonc
{
  "nominalPowerW": 3500,             // saisie manuelle | null
  "effectiveNominalPowerW": 3000,    // remontée par l'onduleur, sinon saisie, sinon null
  "nominalPowerSource": "device",    // device | manual | null
  "movedServerIds": ["uuid", …]      // uniquement dans la réponse d'un PATCH avec moveServers
}
```

- Formulaire onduleur : champ optionnel `nominalPowerW` (entier, 1 à 1 000 000). Si l'onduleur remonte sa puissance nominale, elle est prioritaire (`nominalPowerSource: "device"`). Le front peut l'indiquer, par exemple avec « valeur lue sur l'équipement ».
- **Déplacer un onduleur de salle avec ses serveurs** : `PATCH /ups/:id` avec `{ "roomId": "<nouvelle salle>", "moveServers": true }`.
  - L'onduleur **et** tous ses serveurs changent de salle dans une seule transaction : tout ou rien.
  - La réponse contient `movedServerIds`.
  - Sans `moveServers` (défaut `false`), seul l'onduleur change.
  - Proposer une case à cocher « Déplacer aussi les N serveurs alimentés » dès que la salle change.

### 1.6 WebSocket namespace `/ups`

| Événement | Quand | Payload |
|---|---|---|
| `battery:status` | à chaque relevé | `batteryStatus` complet (§1.3, avec `telemetry`) |
| `battery:status-changed` | **NOUVEAU** : passage secteur ↔ batterie | `{ upsId, upsName, previous: boolean|null, current: boolean, at, status }` |
| `battery:alert` | uniquement quand `alertLevel` change (plus à chaque minute) | `{ upsId, upsName, previousAlertLevel, status: { ip, minutesRemaining, alertLevel, statusLabel, timestamp } }` |

Requêtes acceptées par le socket, inchangées : `battery:request-status` (`upsId`) et `battery:request-bulk-status` (`upsId[]`).

---

## 2. Alertes

### 2.1 Modèle

```jsonc
// AlertResponseDto
{
  "id": "uuid",
  "dedupKey": "ups:<upsId>:on_battery",
  "type": "ups_on_battery",
  "severity": "critical",                 // critical | warning | info
  "status": "open",                       // open | resolved
  "resourceType": "ups",                  // ups | server | vm | room
  "resourceId": "uuid",
  "resourceName": "UPS-B2",
  "title": "UPS-B2 est sur batterie",     // prêt à afficher
  "message": "Coupure secteur : les serveurs alimentés par UPS-B2 tournent sur batterie (14 min d'autonomie).",
  "details": { "atOpen": {…}, "latest": {…} },   // télémétrie à l'ouverture et au dernier relevé
  "openedAt": "…", "lastSeenAt": "…", "resolvedAt": null,
  "acknowledgedAt": null, "acknowledgedById": null,
  "acknowledged": false,
  "occurrences": 3,
  "transitions": [ … ]                    // uniquement sur GET /alerts/:id
}
// transition
{ "id", "type": "opened|escalated|deescalated|acknowledged|unacknowledged|resolved",
  "at", "byUserId", "byUsername", "fromSeverity", "toSeverity" }
```

Comportement :
- **Une alerte ouverte maximum par problème** (`dedupKey`). Les relevés suivants incrémentent `occurrences`, sans créer de doublon.
- La sévérité peut monter ou descendre tant que l'alerte est ouverte. Une alerte acquittée qui **s'aggrave perd son acquittement** et redevient « non acquittée ».
- Les alertes **se résolvent toutes seules** quand le problème disparaît, par exemple au retour secteur.

Types d'alerte :

| Type | Sévérité | Ressource |
|---|---|---|
| `ups_on_battery` | critical | ups |
| `ups_low_battery` | critical | ups |
| `ups_unreachable` | warning (3 relevés en échec) | ups |
| `ups_overload` | warning | ups |
| `ups_replace_battery` | warning | ups |
| `vm_powered_off` | critical si VM haute priorité (`priority ≤ 10`), sinon warning | vm |
| `vm_heartbeat_lost` | warning | vm |
| `host_disconnected` | critical | server (hôte ESXi) |
| `host_cpu_high` | warning (CPU > 90 % sur 3 mesures) | server |
| `server_inlet_temperature_high` | warning / critical | server |
| `server_psu_degraded` | warning | server |
| `server_health_degraded` | warning / critical | server |
| `server_ilo_unreachable` | info | server |

### 2.2 Endpoints

| Méthode | Route | Réponse |
|---|---|---|
| GET | `/alerts?status=open&severity=critical&resourceType=ups&page=1&limit=20` | `{ items: AlertResponseDto[], totalItems, currentPage, totalPages, pageSize }`, triés par sévérité puis du plus récent au plus ancien. `limit` max 100 |
| GET | `/alerts/summary` | `{ open: { critical, warning, info }, unacknowledgedCritical }` |
| GET | `/alerts/:id` | alerte + `transitions` |
| POST | `/alerts/:id/acknowledge` | 200 alerte à jour · **403** pas de droit sur la ressource · **404** · **409** déjà résolue |
| POST | `/alerts/:id/unacknowledge` | idem |

Droit d'acquitter : un admin peut tout acquitter. Pour un serveur ou une VM, il faut le droit WRITE dessus. Pour un onduleur, il faut le droit WRITE sur un des serveurs qu'il alimente.

### 2.3 WebSocket namespace `/alerts`

| Événement | Payload |
|---|---|
| `alert:opened` | `AlertResponseDto` |
| `alert:updated` | `AlertResponseDto` (aggravation, atténuation, acquittement retiré) |
| `alert:acknowledged` | `AlertResponseDto` |
| `alert:resolved` | `AlertResponseDto` |
| `alerts:summary` | `{ open: { critical, warning, info }, unacknowledgedCritical }` |

### 2.4 Correspondance avec la maquette

| Élément UI | Source |
|---|---|
| **Bandeau d'incident** | la plus grave des alertes ouvertes (`GET /alerts?status=open&limit=1`, premier item), mise à jour par les sockets |
| **Cloche** (compteur) | `/alerts/summary` + `alerts:summary` |
| **Pastille « 1 CRIT »** dans la navigation | `unacknowledgedCritical` |
| **Bouton « Acquitter »** | `POST /alerts/:id/acknowledge` ; gérer 403 (masquer ou désactiver) et 409 (rafraîchir) |
| **Widget « Alertes actives »** | `GET /dashboard/widgets/alerts` (format historique conservé) ou `/alerts?status=open` |

---

## 3. Fil d'événements unifié

`GET /events/feed?limit=30&cursor=<nextCursor>&from=<ISO>&to=<ISO>` (`limit` max 200)

```jsonc
{
  "items": [
    {
      "id": "uuid",
      "kind": "alert",                 // alert | action
      "tone": "critical",              // critical | warning | info (sévérité de l'alerte, info pour une action)
      "event": "acknowledged",         // type de transition (alert) ou action historique (START, RESTART, SHUTDOWN, POWER_CONTROL, UPDATE)
      "title": "jbidule a acquitté UPS-B2",   // prêt à afficher
      "resource": { "type": "ups", "id": "uuid", "name": "UPS-B2" },
      "at": "2026-11-04T20:05:00.000Z",
      "by": { "id": "uuid", "username": "jbidule" },   // null si action système
      "alertId": "uuid"                // null pour kind=action
    }
  ],
  "nextCursor": "MjAyNi0xMS0wNFQ…"     // null s'il n'y a plus rien
}
```

- Le fil mélange les transitions d'alertes (sauf les atténuations) et les actions des utilisateurs sur serveurs, VMs et onduleurs (pas de LOGIN).
- **Pagination** : repasser `nextCursor` tel quel pour charger la suite (défilement infini).
- Exemples de titres : `UPS-B2 est sur batterie`, `… — aggravée (critical)`, `Résolue : UPS-B2 est sur batterie`, `jbidule a acquitté UPS-B2`, `zoe a retiré l'acquittement de UPS-B2`, `jbidule a arrêté srv-b2-03`.
- Pour colorer une entrée résolue autrement : tester `event === 'resolved'` (le `tone` reste la sévérité de l'alerte).

---

## 4. VMware : état du parc

### 4.1 VMs

`GET /vm?page=&limit=&serverId=&includeMetrics=true&health=issues`

Avec `includeMetrics=true`, chaque VM porte (lu depuis le cache, **aucun script lancé**) :

```jsonc
{
  "health": "down",              // up | degraded | down | unknown
  "cpuPercent": 42.5,            // number | null
  "uptimeSeconds": 3600,         // number | null
  "powerOff": {                  // null sauf si la VM est down et que la cause est connue
    "at": "2026-11-04T20:05:10.000Z",
    "cause": "manual",           // ha | upstra | manual
    "by": "VSPHERE.LOCAL\\jbidule"   // null sauf manual
  },
  "metrics": { "cpuUsage": 0, "memoryUsage": 0, "memoryMB": 32768, "powerState": "poweredOn", "guestToolsStatus": "green" }  // ancien format conservé
}
```

- `health=issues` renvoie uniquement les VMs qui ne sont pas `up`, triées **down → unknown → degraded**, paginées.
- `unknown` : VM déconnectée, heartbeat gris alors qu'elle est allumée, ou dernière mesure de plus de 3 minutes.
- Libellés de la maquette :

| `powerOff.cause` | Libellé |
|---|---|
| `ha` | « Arrêtée · vSphere HA » |
| `upstra` | « Arrêtée · plan d'arrêt Upstra » |
| `manual` | « Arrêtée · manuellement par {by} » |

### 4.2 Hôtes ESXi

`GET /server/hosts/metrics` renvoie :

```jsonc
[{ "moid": "host-33", "name": "esx-03", "serverId": "uuid|null", "upsId": "uuid|null",
   "health": "up", "connectionState": "connected", "powerState": "poweredOn", "maintenance": false,
   "cpuPercent": 71.2, "memoryPercent": 88.4, "uptimeSeconds": 3456000, "metricsAt": "…" }]
```

Ces données alimentent les tuiles hôtes (CPU, état de connexion, onduleur rattaché).

### 4.3 WebSocket namespace `/vmware`

| Événement | Payload |
|---|---|
| `vmware:metrics` | `{ collectedAt, vms: VmTelemetry[], hosts: HostTelemetry[] }`, **uniquement ce qui a changé** (santé ou CPU arrondi) |
| `vmware:vm-powered-off` | `{ moid, name, hostMoid, powerOff: { at, cause, by } }` |

`VmTelemetry` contient : `moid, name, hostMoid, powerState, connectionState, guestState, heartbeat, overallStatus, cpuUsageMhz, cpuMaxMhz, cpuPercent, memoryUsageMb, memoryMb, numCpu, uptimeSeconds, bootTime, ip, health, metricsAt`.

Pour appliquer un diff sur la table des VMs, la clé de jointure est le `moid` (présent sur les VMs de `/vm`).

---

## 5. Santé matérielle (iLO Redfish) et salles

### 5.1 Serveurs

`GET /server` (items) et `GET /server/:id` ont un nouveau champ :

```jsonc
"hardware": {                      // null si pas d'iLO ou pas encore de relevé
  "inletC": 31,                    // température d'entrée d'air, null si pas de sonde (iLO 4)
  "consumedW": 412,
  "psu": { "ok": 1, "total": 2 },  // « PSU 2 absente » quand ok < total
  "health": "Warning",             // OK | Warning | Critical | null
  "collectedAt": "…"
}
```

### 5.2 Salles

- `GET /room/:id/environment` renvoie `{ maxInletC, maxInletServerId, totalConsumedW, serversWithIlo, serversReporting }` (404 si la salle n'existe pas). Il donne la température max de la baie et la conso totale.
- Création et modification de salle : champs optionnels `inletWarnC` et `inletCritC` (°C, 0 à 80). Ce sont les seuils d'alerte d'entrée d'air propres à la salle, exposés aussi dans les réponses salle. Sans seuil de salle, le back utilise ceux de Redfish, sinon 30/35 °C.

---

## 6. Historique des mesures (courbes)

`GET /metrics/series?metric=<m>&scope=<s>&id=<id>&range=<r>`

| `metric` | Unité | `scope` autorisés | Remarque |
|---|---|---|---|
| `total_power` | W | `total` | puissance totale de tous les onduleurs |
| `ups_real_power` | W | `total`, `ups` | |
| `ups_battery_charge` | % | `total`, `ups` | |
| `ups_runtime` | s | `total`, `ups` | |
| `ups_load` | % | `total`, `ups` | |
| `ups_input_voltage` | V | `total`, `ups` | |
| `host_cpu` | % | `total`, `host` | `id` = moid (`host-33`) |
| `server_inlet` | °C | `total`, `server` | |
| `server_power` | W | `total`, `server` | |

- `range` : `1h` (un point / 15 s), `24h` (un point / 2 min), `7d` (un point / 15 min).
- `id` : obligatoire si `scope` ≠ `total`. C'est l'UUID de l'onduleur ou du serveur, ou le moid de l'hôte.

```jsonc
{ "metric": "ups_real_power", "unit": "W", "range": "24h", "step": 120,
  "series": [{ "label": "UPS-B2", "points": [[1762286400000, 1830], …] }] }
```

Erreurs :
- **400** : metric, scope, id ou range hors liste blanche.
- **503** `{ code: "HISTORY_UNAVAILABLE" }` : afficher « Historique indisponible » **à la place de la courbe uniquement**. Le reste de la page doit continuer à fonctionner.

Le back met chaque combinaison en cache 15 s : inutile de rafraîchir plus souvent.

---

## 7. Dashboard

### 7.1 `GET /dashboard/full`

Tous les anciens champs sont conservés, et les KPI suivants s'ajoutent, lus depuis le cache :

```jsonc
{
  "hostsTotal": 4, "hostsConnected": 4,
  "vmsByHealth": { "up": 140, "degraded": 6, "down": 3, "unknown": 2 },
  "totalPowerW": 5480,            // null si aucun onduleur ne remonte sa puissance
  "totalCapacityW": 9000,         // null dès qu'UN onduleur n'a pas de puissance nominale → afficher « — »
  "maxInletC": 31, "maxInletRoomId": "uuid", "maxInletServerName": "srv-b2-03",
  "upsOnBattery": 1,
  "openAlerts": { "critical": 1, "warning": 3, "info": 0 }
}
```

### 7.2 Widgets existants modifiés

- `GET /dashboard/widgets/ups-status` :
  - `status` vaut `onBattery` seulement si l'onduleur est **réellement** sur batterie ;
  - `batteryLevel`, `load` et `temperature` viennent de la télémétrie (`null` si inconnus) ;
  - `summary.averageLoad` est la moyenne des charges connues.
- `GET /dashboard/widgets/alerts` : **vraies alertes** à la place des 3 alertes codées en dur, même format qu'avant (`acknowledged` = `acknowledgedAt !== null`).
- `GET /dashboard/widgets/system-health` : `components[].uptime` vaut **`null`**. L'ancienne valeur était inventée (99,95 / 97 / 25). Afficher « — ».

### 7.3 Tableaux personnalisés (`/dashboard/layouts`)

- **Nouveaux `type` de widget** : `incident`, `kpis`, `ups`, `vms`, `hosts`, `events`, `power`, `presence`. Les anciens types restent valides : `alerts`, `system-health`, `stats`, `activity-feed`, `user-presence`, `ups-status`, `resource-usage`.
- **Nouvelle règle de position**, validée par le back :
  - `position.x` = **rang** dans la liste (entier ≥ 0) ;
  - `position.w` = **largeur sur 12 colonnes**, uniquement **4, 6, 8 ou 12**. Toute autre valeur donne un 400 ;
  - `position.y` = `0` et `position.h` = `1` (envoyer ces valeurs).
- **Les tableaux existants sont migrés en base** : ordre de lecture conservé, largeurs arrondies, et anciens types convertis (`stats`→`kpis`, `activity-feed`→`events`, `user-presence`→`presence`, `ups-status`→`ups`).
- **Nouvel utilisateur** : au premier `GET /dashboard/layouts`, le back crée « Tableau principal » avec `incident 12, kpis 12, ups 8, hosts 4, vms 8, events 4`.
- **À faire côté front** : retirer le type `resource-usage`, qui n'existe que dans les types du front et n'a aucune donnée côté back.

---

## 8. Présence : qui est connecté et sur quelle page

**Socket** : namespace par défaut, avec `auth: { token }` comme aujourd'hui.

Le front doit émettre `user:ping` :
- **toutes les 30 s** ;
- **à chaque changement de page** (`router.afterEach`).

```js
socket.emit('user:ping', { route: to.fullPath, title: to.meta.title ?? document.title });
```

- `route` doit commencer par `/` (sinon il est ignoré) et `title` est tronqué à 255 caractères.
- **Inactivité** : envoyer `{ active: false }` quand l'onglet est en arrière-plan (`document.visibilityState === 'hidden'`). L'utilisateur reste en ligne, mais ce ping ne compte pas comme une activité. Sans ça, il ne passera jamais `idle` tant que l'onglet est ouvert.
- Sans ping pendant 60 s, l'utilisateur passe hors ligne.

**Réception** : événement `presence:update`, aussi renvoyé par `GET /presence` (liste des connectés) :

```jsonc
{ "userId": "uuid", "online": true, "status": "active",   // active | idle | null (hors ligne)
  "route": "/ups", "title": "Onduleurs", "lastActivityAt": "…" }
```

- `idle` = pas d'activité depuis plus de 2 min. Le back pousse un `presence:update` au moment du passage `active` → `idle`.
- `route`, `title` et `lastActivityAt` valent `null` pour un spectateur qui n'a pas le droit de voir les autres utilisateurs (même règle que la liste des utilisateurs : compte authentifié et actif).
- `GET /presence/:userId` (`{ online }`) est inchangé.

---

## 9. Autres changements visibles par le front

- **Plan de migration / redémarrage** :
  - un seul à la fois ;
  - `POST /vmware/servers/migration/plan` ou `/migration/restart` pendant qu'un plan tourne renvoie **400** « A migration or restart plan is already running » : afficher un message clair ;
  - un plan peut désormais durer jusqu'à 30 min.
- Aucun autre contrat d'API n'a changé.

---

## 10. Checklist d'implémentation suggérée

1. **Types TS** : `UpsTelemetry`, `BatteryStatus` étendu, `Alert`, `AlertTransition`, `AlertSummary`, `FeedItem`, `VmHealth`, `PowerOff`, `HostMetrics`, `ServerHardware`, `RoomEnvironment`, `MetricSeries`, `PresenceView`, plus les nouveaux `WidgetType`.
2. **Store alertes** : `/alerts/summary` + `/alerts?status=open`, socket `/alerts`, puis bandeau d'incident, cloche, pastille « 1 CRIT » et bouton Acquitter (gérer 403 et 409).
3. **Fil d'événements** : `/events/feed` avec défilement infini sur `nextCursor`, rafraîchi sur les événements `alert:*`.
4. **Page Onduleurs et cartes UPS** : `batteryStatus.telemetry`, socket `/ups` (`battery:status`, `battery:status-changed`), courbes `/metrics/series` (gérer le 503), case « déplacer les serveurs » dans l'édition.
5. **Table VMs** : `/vm?includeMetrics=true` (+ filtre `health=issues`), libellés « Arrêtée · … », diff `vmware:metrics`.
6. **Tuiles hôtes** : `/server/hosts/metrics`.
7. **Serveurs et salles** : `hardware`, `/room/:id/environment`, seuils de salle dans les formulaires.
8. **Dashboard** : KPI de `/dashboard/full`, widgets `incident / kpis / ups / vms / hosts / events / power / presence`, éditeur de tableau en mode « ordre + largeur » (4, 6, 8, 12), suppression de `resource-usage`.
9. **Présence** : `user:ping` toutes les 30 s et à chaque changement de page, `active: false` onglet caché, widget « Qui est connecté » via `GET /presence` + `presence:update`.
10. **Partout** : `null` affiché « — », jamais de valeur recalculée.

---

## 11. Tester avec les simulateurs (stack démo)

```bash
# Coupure secteur : la batterie descend de 5 % par minute
curl -X POST "http://localhost:5010/scenario/on-battery?rate=5"
# Retour secteur / remise à zéro
curl -X POST http://localhost:5010/scenario/online
curl -X POST http://localhost:5010/simulate/restore
# Drapeaux onduleur
curl -X POST "http://localhost:5010/scenario/overload?enabled=true"
curl -X POST "http://localhost:5010/scenario/replace-battery?enabled=true"

# iLO : scénario maquette (PSU 2 absente, entrée d'air 31 °C, santé Warning)
curl -k -X POST https://localhost:5001/admin/scenario/maquette
curl -k -X POST "https://localhost:5001/admin/inlet?celsius=44"     # déclenche l'alerte température
curl -k -X POST https://localhost:5001/admin/scenario/ilo4-no-inlet # iLO 4 sans sonde → inletC null
```

Dans la configuration onduleur de l'UI, pointer sur `http://mock-ups:8000` (`http://mock-ups:8000/battery` reste accepté).
