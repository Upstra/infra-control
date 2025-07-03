import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsPriority(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPriority',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _: ValidationArguments) {
          return (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= 1 &&
            value <= 4
          );
        },
        defaultMessage(_: ValidationArguments) {
          return 'Priority must be an integer between 1 and 4';
        },
      },
    });
  };
}
