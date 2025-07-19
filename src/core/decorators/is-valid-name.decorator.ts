import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsValidName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Must contain at least one letter and only letters, accents, spaces, and hyphens
          const nameRegex = /^[a-zA-ZÀ-ÿ\u0100-\u017f\u1e00-\u1eff\s-]+$/;
          const hasLetter = /[a-zA-ZÀ-ÿ\u0100-\u017f\u1e00-\u1eff]/.test(value);

          const emojiRegex =
            /[\u{1f600}-\u{1f64f}]|[\u{1f300}-\u{1f5ff}]|[\u{1f680}-\u{1f6ff}]|[\u{1f1e0}-\u{1f1ff}]|[\u{2600}-\u{26ff}]|[\u{2700}-\u{27bf}]/gu;

          return nameRegex.test(value) && hasLetter && !emojiRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} ne peut contenir que des lettres, des accents, des espaces et des tirets. Les caractères spéciaux et emojis ne sont pas autorisés.`;
        },
      },
    });
  };
}
