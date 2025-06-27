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
  ];

  it.each(cases)('translates %s', (input, expected) => {
    expect(translateConstraint(input)).toContain(expected);
  });
});

describe('CustomValidationPipe exceptionFactory', () => {
  it('returns BadRequestException with translated message', () => {
    const pipe = new CustomValidationPipe();
    const error: ValidationError = {
      constraints: { foo: 'must be a string' },
    } as any;
    const exception = (pipe as any).exceptionFactory([
      error,
    ]) as BadRequestException;
    expect(exception).toBeInstanceOf(BadRequestException);
    expect((exception.getResponse() as any).message).toEqual([
      'doit être une chaîne de caractères',
    ]);
  });
});
