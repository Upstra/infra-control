import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainVmService } from '../../../domain/services/permission.domain.vm.service';
import { PermissionVm } from '../../../domain/entities/permission.vm.entity';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Grants read-only access to a VM for a specified grantee.
 *
 * Responsibilities:
 * - Ensure VM entity exists.
 * - Persist permission entry allowing only non-destructive operations.
 *
 * @param dto  CreateReadonlyPermissionVmDto with vmId and granteeId.
 * @returns    Promise<PermissionVmDto> representing the read-only grant.
 *
 * @example
 * const roPerm = await createReadonlyPermissionVmUseCase.execute({ vmId, granteeId });
 */
@Injectable()
export class CreateReadonlyPermissionVmUseCase {
  // …
}

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
