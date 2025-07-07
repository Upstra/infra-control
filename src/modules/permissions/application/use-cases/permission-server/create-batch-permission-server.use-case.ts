import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import {
  BatchPermissionServerDto,
  BatchPermissionServerResponseDto,
} from '../../dto/batch-permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

/**
 * Creates multiple server permissions in a single operation.
 *
 * Responsibilities:
 * - Processes each permission individually to avoid transaction rollback on single failure
 * - Tracks successful and failed operations
 * - Returns detailed response with status for each permission
 *
 * @param dto BatchPermissionServerDto containing array of permissions to create
 * @returns Promise<BatchPermissionServerResponseDto> with results for each permission
 */
@Injectable()
export class CreateBatchPermissionServerUseCase {
  constructor(
    @Inject('PermissionServerRepositoryInterface')
    private readonly repository: PermissionServerRepositoryInterface,
    private readonly domainService: PermissionDomainServerService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: BatchPermissionServerDto,
    userId?: string,
  ): Promise<BatchPermissionServerResponseDto> {
    const response: BatchPermissionServerResponseDto = {
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
        response.created.push(new PermissionServerDto(saved));
        response.successCount++;
      } catch (error) {
        let errorMessage: string;
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = 'Unknown error occurred';
        }

        response.failed.push({
          permission: permissionDto,
          error: errorMessage,
        });
        response.failureCount++;
      }
    }

    await this.logHistory?.executeStructured({
      entity: 'permission_server',
      entityId: 'batch',
      action: 'BATCH_CREATE',
      userId: userId || 'system',
      newValue: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        total: response.total,
      },
      metadata: {
        permissionType: 'server',
        batchOperation: true,
        createdPermissions: response.created.map((p) => ({
          serverId: p.serverId,
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
