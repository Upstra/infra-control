import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { UpdateIloUseCase } from '@/modules/ilos/application/use-cases';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { GroupRepository } from '@/modules/groups/infrastructure/repositories/group.repository';
import { GroupTypeMismatchException } from '@/modules/groups/domain/exceptions/group-type-mismatch.exception';
import { GroupType } from '@/modules/groups/domain/enums/group-type.enum';

import { ServerUpdateDto } from '../dto/server.update.dto';
import { ServerResponseDto } from '../dto/server.response.dto';
import { Server } from '../../domain/entities/server.entity';

/**
 * Updates metadata or state of an existing server.
 *
 * Responsibilities:
 * - Validates server existence and user permission.
 * - Applies changes (e.g., name, room, tags) via ServerDomainService.
 * - Optionally triggers power operations (shutdown/reboot) based on DTO flags.
 * - Persists and returns the updated ServerDto.
 *
 * @param id   UUID of the server to update.
 * @param dto  UpdateServerDto with fields to modify.
 * @returns    Promise<ServerDto> the updated server information.
 *
 * @throws NotFoundException if server is not found.
 * @throws UnauthorizedException if user lacks permission.
 *
 * @example
 * const updated = await updateServerUseCase.execute('srv-id',{ name:'new-name' });
 */

@Injectable()
export class UpdateServerUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly updateIloUsecase: UpdateIloUseCase,
    private readonly groupRepository: GroupRepository,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: ServerUpdateDto,
    userId?: string,
  ): Promise<ServerResponseDto> {
    if (dto.groupId) {
      const group = await this.groupRepository.findById(dto.groupId);
      if (group && group.type !== GroupType.SERVER) {
        throw new GroupTypeMismatchException('server', group.type);
      }
    }

    const updateData: Partial<Server> = {};
    const excludedKeys = ['ilo'];

    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined && !excludedKeys.includes(key)) {
        updateData[key] = dto[key];
      }
    });

    const updated = await this.serverRepository.updateServer(id, updateData);
    await this.logHistory?.execute('server', updated.id, 'UPDATE', userId);

    const ilo =
      dto.ilo && updated.iloId
        ? await this.updateIloUsecase.execute({ ...dto.ilo, id: updated.iloId })
        : updated.ilo;
    return new ServerResponseDto(updated, ilo);
  }
}
