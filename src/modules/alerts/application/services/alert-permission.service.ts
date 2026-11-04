import { Inject, Injectable } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionStrategyFactory } from '@/core/guards/strategies/permission-strategy.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertResourceType } from '../../domain/types/alert.types';

const ACT_PERMISSION = PermissionBit.WRITE;

@Injectable()
export class AlertPermissionService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('PermissionStrategyFactory')
    private readonly strategyFactory: PermissionStrategyFactory,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async canAct(userId: string, alert: Alert): Promise<boolean> {
    const user = await this.userRepository.findOneByField({
      field: 'id',
      value: userId,
      relations: ['roles'],
      disableThrow: true,
    });
    if (user?.roles?.some((role) => role.isAdmin)) return true;

    switch (alert.resourceType) {
      case AlertResourceType.SERVER:
      case AlertResourceType.VM:
        return this.strategyFactory
          .getStrategy(alert.resourceType)
          .checkPermission(userId, alert.resourceId, ACT_PERMISSION);
      case AlertResourceType.UPS:
        return this.canActOnUps(userId, alert.resourceId);
      default:
        return false;
    }
  }

  private async canActOnUps(userId: string, upsId: string): Promise<boolean> {
    const servers = await this.serverRepository.findAllByField({
      field: 'upsId',
      value: upsId,
      disableThrow: true,
    });
    const strategy = this.strategyFactory.getStrategy('server');
    for (const server of servers) {
      if (await strategy.checkPermission(userId, server.id, ACT_PERMISSION)) {
        return true;
      }
    }
    return false;
  }
}
