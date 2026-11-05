import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpsDomainService } from '../../domain/services/ups.domain.service';
import { UpsRepositoryInterface } from '../../domain/interfaces/ups.repository.interface';
import { UpsUpdateDto } from '../../application/dto/ups.update.dto';
import { UpsResponseDto } from '../../application/dto/ups.response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { Ups } from '../../domain/entities/ups.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { UpsBatteryCacheService } from '../services/ups-battery-cache.service';
import { BatteryStatusResponseDto } from '../dto/battery-status.response.dto';

@Injectable()
export class UpdateUpsUseCase {
  constructor(
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly upsDomainService: UpsDomainService,
    private readonly dataSource: DataSource,
    private readonly upsBatteryCacheService: UpsBatteryCacheService,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    id: string,
    dto: UpsUpdateDto,
    userId?: string,
  ): Promise<UpsResponseDto> {
    const current = await this.upsRepository.findUpsById(id);
    const previousRoomId = current.roomId;
    const ups = await this.upsDomainService.createUpsEntityFromUpdateDto(
      current,
      dto,
    );
    const roomChanged = ups.roomId !== previousRoomId;
    const moveServers = roomChanged && dto.moveServers === true;

    const movedServerIds = await this.dataSource.transaction(
      async (manager) => {
        await manager.save(Ups, ups);
        if (!moveServers) return [];
        const servers = await manager.find(Server, {
          where: { upsId: ups.id },
          select: ['id'],
        });
        for (const server of servers) {
          await manager.update(
            Server,
            { id: server.id },
            { roomId: ups.roomId },
          );
        }
        return servers.map((server) => server.id);
      },
    );

    await this.logChange(
      ups,
      previousRoomId,
      roomChanged,
      movedServerIds,
      userId,
    );

    const result = await this.upsRepository.findByIdWithServerCount(ups.id);
    const cachedStatus = await this.upsBatteryCacheService.get(ups.id);
    const response = new UpsResponseDto(
      result.ups,
      result.serverCount,
      cachedStatus ? new BatteryStatusResponseDto(cachedStatus) : undefined,
    );
    if (moveServers) response.movedServerIds = movedServerIds;
    return response;
  }

  private async logChange(
    ups: Ups,
    previousRoomId: string,
    roomChanged: boolean,
    movedServerIds: string[],
    userId?: string,
  ): Promise<void> {
    if (!roomChanged) {
      await this.logHistory?.execute('ups', ups.id, 'UPDATE', userId);
      return;
    }
    await this.logHistory?.executeStructured({
      entity: 'ups',
      entityId: ups.id,
      action: 'UPDATE',
      userId,
      oldValue: { roomId: previousRoomId },
      newValue: { roomId: ups.roomId },
      metadata: { movedServerIds },
    });
  }
}
