export class VmNotFoundException extends Error {
  constructor(id: string) {
    super(`La VM avec l'ID ${id} est introuvable.`);
  }
}

export class VmCreationException extends Error {
  constructor(message = 'Erreur lors de la création de la VM') {
    super(message);
  }
}

export class VmUpdateException extends Error {
  constructor(message = 'Erreur lors de la mise à jour de la VM') {
    super(message);
  }
}

export class VmDeletionException extends Error {
  constructor(message = 'Erreur lors de la suppression de la VM') {
    super(message);
  }
}

export class VmRetrievalException extends Error {
  constructor(message = 'Erreur lors de la récupération des VMs') {
    super(message);
  }
}
