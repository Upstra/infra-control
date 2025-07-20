import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Custom validator that makes priority field conditionally required based on server type
 * Priority is required for all server types except 'vcenter'
 */
@ValidatorConstraint({ name: 'isConditionalPriority', async: false })
export class IsConditionalPriorityConstraint
  implements ValidatorConstraintInterface
{
  validate(priority: any, args: ValidationArguments): boolean {
    const object = args.object as any;
    const serverType = object.type;

    if (serverType === 'vcenter') {
      return (
        priority === undefined ||
        priority === null ||
        this.isValidPriority(priority)
      );
    }

    return (
      priority !== undefined &&
      priority !== null &&
      this.isValidPriority(priority)
    );
  }

  private isValidPriority(value: any): boolean {
    const numValue = Number(value);
    return (
      !isNaN(numValue) &&
      Number.isInteger(numValue) &&
      numValue >= 1 &&
      numValue <= 999
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;
    const serverType = object.type;

    if (serverType === 'vcenter') {
      return 'Priority must be a number between 1 and 999 if provided';
    }
    return 'Priority is required and must be a number between 1 and 999';
  }
}

/**
 * Decorator that validates priority conditionally based on server type
 * @param validationOptions Optional validation options
 */
export function IsConditionalPriority(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsConditionalPriorityConstraint,
    });
  };
}
