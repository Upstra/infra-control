import { Injectable } from '@nestjs/common';
import { IloHealthCacheService } from '@/modules/ilos/application/services/ilo-health-cache.service';
import { IloHealthDomainService } from '@/modules/ilos/domain/services/ilo-health.domain.service';
import { ServerResponseDto } from '../dto/server.response.dto';

@Injectable()
export class EnrichServersWithHardwareUseCase {
  constructor(
    private readonly cache: IloHealthCacheService,
    private readonly healthService: IloHealthDomainService,
  ) {}

  async execute<T extends ServerResponseDto>(servers: T[]): Promise<T[]> {
    const withIlo = servers.filter((server) => server.iloId);
    const health = await this.cache.getMany(withIlo.map((server) => server.id));
    return servers.map((server) =>
      Object.assign(server, {
        hardware: health[server.id]
          ? this.healthService.summarize(health[server.id])
          : null,
      }),
    );
  }
}
