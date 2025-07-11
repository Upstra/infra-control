import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository, In, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { PermissionServer } from '@/modules/permissions/domain/entities/permission.server.entity';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { User } from '@/modules/users/domain/entities/user.entity';

interface IloPermissionMetadata {
  requiredBit: PermissionBit;
}

export const ILO_PERMISSION_KEY = 'ilo_permission';

@Injectable()
export class IloPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Server)
    private serverRepository: Repository<Server>,
    @InjectRepository(PermissionServer)
    private permissionServerRepository: Repository<PermissionServer>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<IloPermissionMetadata>(
      ILO_PERMISSION_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      return false;
    }

    const isAdmin = user.roles?.some((role) => role.isAdmin === true);
    if (isAdmin) {
      return true;
    }

    const iloIp = request.params.ip;
    if (!iloIp) {
      throw new ForbiddenException('IP address is required');
    }

    const server = await this.serverRepository.findOne({
      where: { ilo: { ip: iloIp } },
      relations: ['ilo'],
    });

    if (!server) {
      throw new NotFoundException('Server with this iLO IP not found');
    }

    const userRoleIds = user.roles.map((role) => role.id);

    const permissions = await this.permissionServerRepository.find({
      where: [
        { role: { id: In(userRoleIds) }, server: { id: server.id } },
        { role: { id: In(userRoleIds) }, server: IsNull() },
      ],
    });

    const hasPermission = permissions.some(
      (permission) => (permission.bitmask & metadata.requiredBit) !== 0,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action on this server',
      );
    }

    return true;
  }
}