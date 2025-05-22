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
        const messages = errors.map((error) => {
          const constraints = error.constraints ?? {};
          return Object.values(constraints)
            .map((msg) => translateConstraint(msg))
            .join(', ');
        });
        return new BadRequestException(messages);
      },
    });
  }
}

function translateConstraint(message: string): string {
  return message
    .replace('must be a string', 'doit être une chaîne de caractères')
    .replace('must be an email', 'doit être une adresse email valide')
    .replace('must be longer than or equal to', 'doit contenir au moins')
    .replace('characters', 'caractères')
    .replace('must be shorter than or equal to', 'doit contenir au maximum')
    .replace('each value in', 'chaque valeur de')
    .replace('must be a valid enum value', 'doit être une valeur valide')
    .replace('must be a boolean value', 'doit être un booléen')
    .replace('must be an integer number', 'doit être un entier');
}
