export class UserNotFoundException extends Error {
  constructor(id: string) {
    super(`Utilisateur avec l'ID ${id} introuvable.`);
  }
}

export class UserUpdateException extends Error {
  constructor(message = 'Erreur lors de la mise à jour de l’utilisateur') {
    super(message);
  }
}

export class UserDeletionException extends Error {
  constructor(message = 'Erreur lors de la suppression de l’utilisateur') {
    super(message);
  }
}

export class UserRetrievalException extends Error {
  constructor(
    message = 'Erreur lors de la récupération des données utilisateur',
  ) {
    super(message);
  }
}

export class UserConflictException extends Error {
  constructor(type: 'username' | 'email', message = 'déjà utilisé') {
    let typeLabel = type === 'username' ? 'Nom d’utilisateur' : 'Email';
    super(`${typeLabel} ${message}`);
  }
}

export class UserRegistrationException extends Error {
  constructor(message = 'Erreur lors de l’inscription de l’utilisateur') {
    super(message);
  }
}

export class CannotDeleteLastAdminException extends Error {
  constructor(message = 'Impossible de supprimer le dernier administrateur') {
    super(message);
  }
}

export class CannotRemoveLastAdminException extends Error {
  constructor(
    message = 'Impossible de retirer le dernier rôle administrateur',
  ) {
    super(message);
  }
}

export class CannotDeleteOwnAccountException extends Error {
  constructor(
    message = 'Impossible de supprimer votre propre compte administrateur',
  ) {
    super(message);
  }
}

export class CannotToggleOwnStatusException extends Error {
  constructor(message = 'Impossible de modifier votre propre statut') {
    super(message);
  }
}

export class CannotDeactivateLastAdminException extends Error {
  constructor(message = 'Impossible de désactiver le dernier administrateur') {
    super(message);
  }
}

export class UserExceptions {
  static notFound(id?: string): UserNotFoundException {
    return new UserNotFoundException(id ?? 'User not found');
  }

  static updateFailed(message?: string): UserUpdateException {
    return new UserUpdateException(message);
  }

  static deletionFailed(message?: string): UserDeletionException {
    return new UserDeletionException(message);
  }

  static retrievalFailed(message?: string): UserRetrievalException {
    return new UserRetrievalException(message);
  }

  static conflict(
    type: 'username' | 'email',
    message?: string,
  ): UserConflictException {
    return new UserConflictException(type, message);
  }

  static registrationFailed(message?: string): UserRegistrationException {
    return new UserRegistrationException(message);
  }

  static cannotDeleteLastAdmin(): CannotDeleteLastAdminException {
    return new CannotDeleteLastAdminException();
  }

  static cannotRemoveLastAdminRole(): CannotRemoveLastAdminException {
    return new CannotRemoveLastAdminException();
  }

  static cannotDeleteOwnAccount(): CannotDeleteOwnAccountException {
    return new CannotDeleteOwnAccountException();
  }

  static cannotToggleOwnStatus(): CannotToggleOwnStatusException {
    return new CannotToggleOwnStatusException();
  }

  static cannotDeactivateLastAdmin(): CannotDeactivateLastAdminException {
    return new CannotDeactivateLastAdminException();
  }
}
