import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainVmService } from '../../../domain/services/permission.domain.vm.service';
import { PermissionVm } from '../../../domain/entities/permission.vm.entity';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

@Injectable()
export class CreateReadOnlyPermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
    private readonly domainService: PermissionDomainVmService,
  ) {}

  async execute(): Promise<PermissionVm> {
    const entity = this.domainService.createReadOnlyPermissionEntity();
    return await this.repository.save(entity);
  }
}
