import { Inject, Injectable } from '@nestjs/common';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { IloHealthCacheService } from '../services/ilo-health-cache.service';
import { IloHealth } from '../../domain/interfaces/ilo-health.interface';
import {
  GlobalEnvironmentDto,
  RoomEnvironmentResponseDto,
} from '../dto/room-environment.response.dto';

interface Reading {
  server: Server;
  health: IloHealth;
}

@Injectable()
export class GetHardwareEnvironmentUseCase {
  constructor(
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    private readonly cache: IloHealthCacheService,
  ) {}

  async forRoom(roomId: string): Promise<RoomEnvironmentResponseDto> {
    await this.roomRepository.findRoomById(roomId);
    const servers = (await this.serverRepository.findAll()).filter(
      (server) => server.roomId === roomId && !!server.iloId,
    );
    const readings = await this.readings(servers);
    const hottest = this.hottest(readings);
    return {
      maxInletC: hottest?.health.thermal.inletC ?? null,
      maxInletServerId: hottest?.server.id ?? null,
      totalConsumedW: this.totalConsumed(readings),
      serversWithIlo: servers.length,
      serversReporting: readings.length,
    };
  }

  async global(): Promise<GlobalEnvironmentDto> {
    const servers = (await this.serverRepository.findAll()).filter(
      (server) => !!server.iloId,
    );
    const readings = await this.readings(servers);
    const hottest = this.hottest(readings);
    return {
      maxInletC: hottest?.health.thermal.inletC ?? null,
      maxInletRoomId: hottest?.server.roomId ?? null,
      maxInletServerId: hottest?.server.id ?? null,
      maxInletServerName: hottest?.server.name ?? null,
      totalConsumedW: this.totalConsumed(readings),
    };
  }

  private async readings(servers: Server[]): Promise<Reading[]> {
    const cached = await this.cache.getMany(servers.map((server) => server.id));
    return servers
      .filter((server) => cached[server.id])
      .map((server) => ({ server, health: cached[server.id] }));
  }

  private hottest(readings: Reading[]): Reading | null {
    return readings.reduce<Reading | null>((max, reading) => {
      const inlet = reading.health.thermal.inletC;
      if (inlet === null) return max;
      return max === null || inlet > max.health.thermal.inletC! ? reading : max;
    }, null);
  }

  private totalConsumed(readings: Reading[]): number | null {
    const values = readings
      .map((reading) => reading.health.power.consumedW)
      .filter((value): value is number => value !== null);
    return values.length === 0
      ? null
      : values.reduce((sum, value) => sum + value, 0);
  }
}
