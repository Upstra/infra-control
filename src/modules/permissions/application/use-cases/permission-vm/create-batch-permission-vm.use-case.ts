import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainVmService } from '../../../domain/services/permission.domain.vm.service';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import { BatchPermissionVmDto, BatchPermissionVmResponseDto } from '../../dto/batch-permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';

/**
 * Creates multiple VM permissions in a single operation.
 *
 * Responsibilities:
 * - Processes each permission individually to avoid transaction rollback on single failure
 * - Tracks successful and failed operations
 * - Returns detailed response with status for each permission
 *
 * @param dto BatchPermissionVmDto containing array of permissions to create
 * @returns Promise<BatchPermissionVmResponseDto> with results for each permission
 */
@Injectable()
export class CreateBatchPermissionVmUseCase {
  constructor(
    @Inject('PermissionVmRepositoryInterface')
    private readonly repository: PermissionVmRepositoryInterface,
    private readonly domainService: PermissionDomainVmService,
  ) {}

  async execute(dto: BatchPermissionVmDto): Promise<BatchPermissionVmResponseDto> {
    const response: BatchPermissionVmResponseDto = {
      created: [],
      failed: [],
      total: dto.permissions.length,
      successCount: 0,
      failureCount: 0,
    };

    for (const permissionDto of dto.permissions) {
      try {
        const entity = this.domainService.createPermissionEntityFromDto(permissionDto);
        const saved = await this.repository.save(entity);
        response.created.push(new PermissionVmDto(saved));
        response.successCount++;
      } catch (error) {
        response.failed.push({
          permission: permissionDto,
          error: error.message ?? 'Unknown error occurred',
        });
        response.failureCount++;
      }
    }

    return response;
  }
}