import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

import { ServerDomainService } from '@/modules/servers/domain/services/server.domain.service';
import { CreateIloUseCase } from '@/modules/ilos/application/use-cases';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerResponseDto } from '../dto/server.response.dto';

@Injectable()
export class CreateServerUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly createIloUsecase: CreateIloUseCase,
    private readonly serverDomain: ServerDomainService,
  ) {}

  async execute(dto: ServerCreationDto): Promise<ServerResponseDto> {
    const entity = this.serverDomain.createServerEntityFromDto(dto);
    const server = await this.serverRepository.save(entity);
    const ilo = await this.createIloUsecase.execute(dto.ilo);
    return new ServerResponseDto(server, ilo);
  }
}
