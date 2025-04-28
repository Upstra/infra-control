export class ServerNotFoundException extends Error {
  constructor(id: string) {
    super(`Le serveur avec l'ID ${id} est introuvable.`);
  }
}

export class ServerCreationException extends Error {
  constructor(message = 'Erreur lors de la création du serveur') {
    super(message);
  }
}

export class ServerUpdateException extends Error {
  constructor(message = 'Erreur lors de la mise à jour du serveur') {
    super(message);
  }
}

export class ServerDeletionException extends Error {
  constructor(message = 'Erreur lors de la suppression du serveur') {
    super(message);
  }
}

export class ServerRetrievalException extends Error {
  constructor(message = 'Erreur lors de la récupération des serveurs') {
    super(message);
  }
}
