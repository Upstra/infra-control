import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationOptions,
  isIP,
  registerDecorator,
} from 'class-validator';

const hostnameRegex =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

/**
 * Accepts an IPv4/IPv6 address, a bare hostname (e.g. Docker service name), or a
 * full http(s) URL. Real hardware is reached by IP; the demo stack's mock services
 * (vcsim, mock-ilo-*, mock-ups) are reached by Docker-network hostname, and the
 * UPS battery script explicitly supports an http(s) URL for its demo mode.
 */
@ValidatorConstraint({ name: 'isIpHostnameOrUrl', async: false })
export class IsIpHostnameOrUrlConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length === 0) {
      return false;
    }
    return isIP(value) || hostnameRegex.test(value) || urlRegex.test(value);
  }

  defaultMessage(): string {
    return 'must be an IP address, a hostname, or a http(s) URL';
  }
}

export function IsIpHostnameOrUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIpHostnameOrUrlConstraint,
    });
  };
}
