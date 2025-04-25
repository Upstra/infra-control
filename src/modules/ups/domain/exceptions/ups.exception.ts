export class UpsNotFoundException extends Error {
  constructor(id: string) {
    super(`UPS avec l'ID ${id} est introuvable.`);
  }
}

export class UpsCreationException extends Error {
  constructor(message = 'Erreur lors de la création de l’UPS') {
    super(message);
  }
}

export class UpsUpdateException extends Error {
  constructor(message = 'Erreur lors de la mise à jour de l’UPS') {
    super(message);
  }
}

export class UpsDeletionException extends Error {
  constructor(message = 'Erreur lors de la suppression de l’UPS') {
    super(message);
  }
}

export class UpsRetrievalException extends Error {
  constructor(message = 'Erreur lors de la récupération des UPS') {
    super(message);
  }
}
