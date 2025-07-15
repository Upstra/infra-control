import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '../../domain/entities/server.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueServerPriorityConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
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

    const existingServer = await this.serverRepository.findOne({
      where: { priority },
      select: ['id'],
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
