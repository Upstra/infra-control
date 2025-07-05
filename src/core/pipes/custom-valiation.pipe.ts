import {
  Injectable,
  BadRequestException,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = this.formatErrors(errors);
        return new BadRequestException(
          messages.filter((msg) => msg && msg.trim() !== ''),
        );
      },
    });
  }

  private formatErrors(
    errors: ValidationError[],
    parentProperty = '',
  ): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      const property = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint) => {
          const translatedMsg = translateConstraint(constraint);
          if (translatedMsg && translatedMsg.trim() !== '') {
            messages.push(`${property}: ${translatedMsg}`);
          }
        });
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.formatErrors(error.children, property));
      }
    }

    return messages;
  }
}

export function translateConstraint(message: string): string {
  if (!message || typeof message !== 'string') {
    return 'Erreur de validation';
  }

  if (message.includes('must be one of the following values:')) {
    const enumValues = message.split(':')[1]?.trim() ?? '';
    return `doit être l'une des valeurs suivantes: ${enumValues}`;
  }

  return message
    .replace('must be a string', 'doit être une chaîne de caractères')
    .replace('must be an email', 'doit être une adresse email valide')
    .replace('must be longer than or equal to', 'doit contenir au moins')
    .replace('characters', 'caractères')
    .replace('must be shorter than or equal to', 'doit contenir au maximum')
    .replace('each value in', 'chaque valeur de')
    .replace(
      'must be a valid enum value',
      'doit être une valeur valide parmi: stats, activity-feed, alerts, resource-usage, user-presence, system-health, ups-status',
    )
    .replace('must be a boolean value', 'doit être un booléen')
    .replace('must be an integer number', 'doit être un entier')
    .replace(
      'must be a number conforming to the specified constraints',
      'doit être un nombre valide',
    )
    .replace('must not be less than', 'ne doit pas être inférieur à')
    .replace('must not be greater than', 'ne doit pas être supérieur à')
    .replace('should not be empty', 'ne doit pas être vide')
    .replace('must be a UUID', 'doit être un UUID valide');
}
