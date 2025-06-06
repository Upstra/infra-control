export class RoomCreationException extends Error {
  constructor(message: string = 'Erreur lors de la création de la salle') {
    super(message);
  }
}

export class RoomUpdateException extends Error {
  constructor(message: string = 'Erreur lors de la mise à jour de la salle') {
    super(message);
  }
}

export class RoomNotFoundException extends Error {
  constructor(id?: string) {
    super(id ? `Salle avec l'id (${id}) non trouvée` : 'Salle non trouvée');
  }
}

export class RoomDeletionException extends Error {
  constructor(message: string = 'Erreur lors de la suppression de la salle') {
    super(message);
  }
}
