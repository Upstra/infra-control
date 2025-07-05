import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { SwapVmResponseDto } from '../dto/swap-response.dto';
import { GetUserVmPermissionsUseCase } from '../../../permissions/application/use-cases/permission-vm';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { SwapPrioritiesBaseUseCase } from './base/swap-priorities-base.use-case';

@Injectable()
export class SwapVmPrioritiesUseCase extends SwapPrioritiesBaseUseCase<
  Vm,
  { vmId?: string; bitmask: number },
  SwapVmResponseDto
> {
  constructor(
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    private readonly getUserPermissionVm: GetUserVmPermissionsUseCase,
    protected readonly logHistory: LogHistoryUseCase,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource, logHistory);
  }

  protected getEntityRepository(): Repository<Vm> {
    return this.vmRepository;
  }

  protected getEntityName(): string {
    return 'VM';
  }

  protected getEntityNamePlural(): string {
    return 'VMs';
  }

  protected async getUserPermissions(userId: string) {
    return this.getUserPermissionVm.execute(userId);
  }

  protected getPermissionId(permission: {
    vmId?: string;
    bitmask: number;
  }): string {
    return permission.vmId ?? '';
  }

  protected getLogMetadata(entity: Vm, _swapPartner: Vm): Record<string, any> {
    return {
      vmServerId: entity.serverId,
    };
  }

  protected formatResult(entity1: Vm, entity2: Vm): SwapVmResponseDto {
    return {
      vm1: { id: entity1.id, priority: entity1.priority },
      vm2: { id: entity2.id, priority: entity2.priority },
    };
  }
}
