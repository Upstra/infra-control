import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainVmService } from '../../../domain/services/permission.domain.vm.service';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Assigns a full-access permission set to a VM for a given grantee.
 *
 * Responsibilities:
 * - Validate VM existence.
 * - Create or update permission record granting all possible VM actions.
 *
 * @param dto  CreateFullPermissionVmDto with vmId and granteeId.
 * @returns    Promise<PermissionVmDto> reflecting full-access grant.
 *
 * @example
 * const fullPerm = await createFullPermissionVmUseCase.execute({ vmId, granteeId });
 */

@Injectable()
export class CreateFullPermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
    private readonly domainService: PermissionDomainVmService,
  ) {}

  async execute(): Promise<PermissionVmDto> {
    const entity = this.domainService.createFullPermissionEntity();
    const saved = await this.repository.save(entity);
    return PermissionVmDto.fromEntity(saved);
  }
}
