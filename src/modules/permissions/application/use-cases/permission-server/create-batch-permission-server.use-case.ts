import { Inject, Injectable } from '@nestjs/common';
import { PermissionDomainServerService } from '../../../domain/services/permission.domain.server.service';
import { PermissionServerDto } from '../../dto/permission.server.dto';
import { BatchPermissionServerDto, BatchPermissionServerResponseDto } from '../../dto/batch-permission.server.dto';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';

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
  ) {}

  async execute(dto: BatchPermissionServerDto): Promise<BatchPermissionServerResponseDto> {
    const response: BatchPermissionServerResponseDto = {
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
        response.created.push(new PermissionServerDto(saved));
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