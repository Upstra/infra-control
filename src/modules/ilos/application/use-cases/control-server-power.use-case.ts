import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { IloPowerService } from '@/modules/ilos/domain/services/ilo-power.service';
import { IloPowerAction } from '../dto/ilo-power-action.dto';
import { IloPowerResponseDto } from '../dto/ilo-status.dto';

@Injectable()
export class ControlServerPowerUseCase {
  constructor(
    private readonly iloPowerService: IloPowerService,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(
    serverId: string,
    action: IloPowerAction,
  ): Promise<IloPowerResponseDto> {
    const server = await this.serverRepository.findOne({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${serverId} not found`);
    }

    if (!server.ipIlo) {
      throw new NotFoundException(`Server ${serverId} does not have an iLO IP configured`);
    }

    const credentials = {
      user: server.login,
      password: server.password,
    };

    const result = await this.iloPowerService.controlServerPower(
      server.ipIlo,
      action,
      credentials,
    );

    return {
      success: result.success,
      message: result.message,
      currentStatus: result.currentStatus,
    };
  }
}
