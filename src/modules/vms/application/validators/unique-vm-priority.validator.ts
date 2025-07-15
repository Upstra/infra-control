import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueVmPriorityConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
  ) {}

  async validate(
    priority: number,
    args: ValidationArguments,
  ): Promise<boolean> {
    if (typeof priority !== 'number' || !Number.isInteger(priority)) {
      return false;
    }

    const object = args.object as any;
    const vmId = object.id;
    const serverId = object.serverId;

    if (!serverId) {
      return false;
    }

    const existingVm = await this.vmRepository.findOne({
      where: {
        priority,
        serverId,
      },
      select: ['id'],
    });

    if (!existingVm) {
      return true;
    }

    return existingVm.id === vmId;
  }

  defaultMessage(): string {
    return 'VM priority must be unique within the same server';
  }
}

export function IsUniqueVmPriority(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueVmPriorityConstraint,
    });
  };
}
