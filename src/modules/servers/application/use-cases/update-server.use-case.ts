import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import { UpdateIloUseCase } from '@/modules/ilos/application/use-cases';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';

import { ServerUpdateDto } from '../dto/server.update.dto';
import { ServerResponseDto } from '../dto/server.response.dto';

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
    private readonly serverDomain: ServerDomainService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: ServerUpdateDto,
    userId?: string,
  ): Promise<ServerResponseDto> {
    const existing = await this.serverRepository.findServerById(id);
    const entity = this.serverDomain.updateServerEntityFromDto(existing, dto);
    const updated = await this.serverRepository.save(entity);
    await this.logHistory?.execute('server', updated.id, 'UPDATE', userId);

    const ilo = dto.ilo
      ? await this.updateIloUsecase.execute(id, dto.ilo)
      : updated.ilo;
    return new ServerResponseDto(updated, ilo);
  }
}
