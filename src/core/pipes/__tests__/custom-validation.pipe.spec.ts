import { BadRequestException, ValidationError } from '@nestjs/common';
import {
  CustomValidationPipe,
  translateConstraint,
} from '../custom-valiation.pipe';

describe('CustomValidationPipe translateConstraint', () => {
  const cases: Array<[string, string]> = [
    ['must be a string', 'doit être une chaîne de caractères'],
    ['must be an email', 'doit être une adresse email valide'],
    ['must be longer than or equal to', 'doit contenir au moins'],
    ['characters', 'caractères'],
    ['must be shorter than or equal to', 'doit contenir au maximum'],
    ['each value in', 'chaque valeur de'],
    ['must be a valid enum value', 'doit être une valeur valide'],
    ['must be a boolean value', 'doit être un booléen'],
    ['must be an integer number', 'doit être un entier'],
    [
      'must be one of the following values: VM, SERVER',
      "doit être l'une des valeurs suivantes: VM, SERVER",
    ],
    [
      'must be one of the following values: ADMIN, USER',
      "doit être l'une des valeurs suivantes: ADMIN, USER",
    ],
  ];

  it.each(cases)('translates %s', (input, expected) => {
    expect(translateConstraint(input)).toContain(expected);
  });
});

describe('CustomValidationPipe exceptionFactory', () => {
  it('returns BadRequestException with translated message', () => {
    const pipe = new CustomValidationPipe();
    const error: ValidationError = {
      property: 'name',
      constraints: { isString: 'must be a string' },
    } as any;
    const exception = (pipe as any).exceptionFactory([
      error,
    ]) as BadRequestException;
    expect(exception).toBeInstanceOf(BadRequestException);
    expect((exception.getResponse() as any).message).toEqual([
      'name: doit être une chaîne de caractères',
    ]);
  });

  it('translates enum validation errors with values', () => {
    const pipe = new CustomValidationPipe();
    const error: ValidationError = {
      property: 'type',
      constraints: {
        isEnum: 'type must be one of the following values: VM, SERVER',
      },
    } as any;
    const exception = (pipe as any).exceptionFactory([
      error,
    ]) as BadRequestException;
    expect(exception).toBeInstanceOf(BadRequestException);
    expect((exception.getResponse() as any).message).toEqual([
      "type: doit être l'une des valeurs suivantes: VM, SERVER",
    ]);
  });

  it('handles nested validation errors', () => {
    const pipe = new CustomValidationPipe();
    const error: ValidationError = {
      property: 'user',
      children: [
        {
          property: 'email',
          constraints: { isEmail: 'must be an email' },
          children: [],
        },
      ],
    } as any;
    const exception = (pipe as any).exceptionFactory([
      error,
    ]) as BadRequestException;
    expect(exception).toBeInstanceOf(BadRequestException);
    expect((exception.getResponse() as any).message).toEqual([
      'user.email: doit être une adresse email valide',
    ]);
  });

  it('handles empty and valid messages', () => {
    const pipe = new CustomValidationPipe();
    const errors: ValidationError[] = [
      {
        property: 'field1',
        constraints: { custom: '' },
      },
      {
        property: 'field2',
        constraints: { isString: 'must be a string' },
      },
    ] as any;
    const exception = (pipe as any).exceptionFactory(
      errors,
    ) as BadRequestException;
    const messages = (exception.getResponse() as any).message;
    expect(messages).toHaveLength(2);
    expect(messages).toContain('field1: Erreur de validation');
    expect(messages).toContain('field2: doit être une chaîne de caractères');
  });
});
