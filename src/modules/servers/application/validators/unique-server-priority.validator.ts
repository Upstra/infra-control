import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, Inject } from '@nestjs/common';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueServerPriorityConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async validate(
    priority: number,
    args: ValidationArguments,
  ): Promise<boolean> {
    if (typeof priority !== 'number' || !Number.isInteger(priority)) {
      return false;
    }

    const object = args.object as any;
    const serverId = object.id;

    const existingServer = await this.serverRepository.findOneByField({
      field: 'priority',
      value: priority,
      disableThrow: true,
    });

    if (!existingServer) {
      return true;
    }

    return existingServer.id === serverId;
  }

  defaultMessage(): string {
    return 'Server priority must be unique across all servers';
  }
}

export function IsUniqueServerPriority(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueServerPriorityConstraint,
    });
  };
}
