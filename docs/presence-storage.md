# 📡 Gestion de la présence en ligne

Cette page explique comment l'API enregistre l'activité des utilisateurs dans Redis afin de savoir qui est connecté.

## Fonctionnement

- Lorsqu'un utilisateur se connecte, le `PresenceService` crée une clé `presence:<userId>` dans Redis avec la valeur `online`.
- La clé est associée à un TTL de 60 secondes et est renouvelée régulièrement tant que la session reste active.
- Quand l'utilisateur se déconnecte ou que la session expire, la clé est supprimée.

Ce mécanisme permet de compter rapidement les utilisateurs en ligne via la recherche des clés `presence:*`.
