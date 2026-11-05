# 📡 Gestion de la présence en ligne

Cette page explique comment l'API enregistre l'activité des utilisateurs dans Redis afin de savoir qui est connecté, s'il est actif et quelle page il consulte.

## Stockage

- Clé `presence:<userId>`, TTL de 60 secondes, valeur JSON :

```json
{ "route": "/ups", "title": "Onduleurs", "lastActivityAt": "2026-11-05T10:00:00.000Z", "connectedAt": "2026-11-05T09:12:41.000Z" }
```

- La clé est créée à la connexion WebSocket et renouvelée à chaque `user:ping`. Sans ping pendant 60 s, elle expire et l'utilisateur passe hors ligne.
- L'ancienne valeur `online` reste comprise (utilisateur en ligne sans page connue).
- Le nombre d'utilisateurs en ligne se calcule toujours en comptant les clés `presence:*`.

## Ping du front

Le front émet `user:ping` toutes les 30 s et à chaque changement de page (`router.afterEach`) :

```json
{ "route": "/ups", "title": "Onduleurs" }
```

- `route` doit commencer par `/` (sinon elle est ignorée), `title` est tronqué à 255 caractères.
- Un ping avec `"active": false` (onglet en arrière-plan) garde l'utilisateur en ligne sans compter comme une activité.

## Statut

- `active` si la dernière activité date de moins de 2 minutes, `idle` sinon.
- Un balayage toutes les 30 s pousse `presence:update` quand un utilisateur passe de `active` à `idle` (ou l'inverse).

## Exposition

- `GET /presence` et l'événement `presence:update` portent `{ userId, online, status, route, title, lastActivityAt }`.
- La page consultée n'est visible que par les utilisateurs autorisés à voir les autres utilisateurs (même règle que `GET /user` : être authentifié avec un compte actif). Les autres reçoivent `route`, `title` et `lastActivityAt` à `null`.
- Côté WebSocket, chaque socket rejoint la room `presence:full` ou `presence:limited` à la connexion.
