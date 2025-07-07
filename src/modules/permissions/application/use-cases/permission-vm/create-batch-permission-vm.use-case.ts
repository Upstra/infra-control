import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainVmService } from '../../../domain/services/permission.domain.vm.service';
import { PermissionVmDto } from '../../dto/permission.vm.dto';
import {
  BatchPermissionVmDto,
  BatchPermissionVmResponseDto,
} from '../../dto/batch-permission.vm.dto';
import { PermissionVmRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.vm.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

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
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: BatchPermissionVmDto,
    userId?: string,
  ): Promise<BatchPermissionVmResponseDto> {
    const response: BatchPermissionVmResponseDto = {
      created: [],
      failed: [],
      total: dto.permissions.length,
      successCount: 0,
      failureCount: 0,
    };

    for (const permissionDto of dto.permissions) {
      try {
        const entity =
          this.domainService.createPermissionEntityFromDto(permissionDto);
        const saved = await this.repository.save(entity);
        response.created.push(PermissionVmDto.fromEntity(saved));
        response.successCount++;
      } catch (error) {
        response.failed.push({
          permission: permissionDto,
          error: error.message ?? 'Unknown error occurred',
        });
        response.failureCount++;
      }
    }

    await this.logHistory?.executeStructured({
      entity: 'permission_vm',
      entityId: 'batch',
      action: 'BATCH_CREATE',
      userId: userId || 'system',
      newValue: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        total: response.total,
      },
      metadata: {
        permissionType: 'vm',
        batchOperation: true,
        createdPermissions: response.created.map((p) => ({
          vmId: p.vmId,
          roleId: p.roleId,
          bitmask: p.bitmask,
        })),
        failedPermissions: response.failed.map((f) => ({
          permission: f.permission,
          error: f.error,
        })),
      },
    });

    return response;
  }
}
