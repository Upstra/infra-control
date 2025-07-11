import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloStatusResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class GetServerStatusUseCase {
  constructor(
    private readonly iloPowerService: IloPowerService,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(serverId: string): Promise<IloStatusResponseDto> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
      relations: ['ilo'],
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverId} not found`);
    }

    if (!server.ilo) {
      throw new NotFoundException(`Server ${serverId} does not have an iLO configured`);
    }

    const credentials = {
      user: server.ilo.login,
      password: server.ilo.password,
    };

    const status = await this.iloPowerService.getServerStatus(
      server.ilo.ip,
      credentials,
    );

    return {
      status,
      ip: server.ilo.ip,
    };
  }
}
