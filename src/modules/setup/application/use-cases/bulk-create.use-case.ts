import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { RoomRepositoryInterface } from '../../../rooms/domain/interfaces/room.repository.interface';
import { UpsRepositoryInterface } from '../../../ups/domain/interfaces/ups.repository.interface';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import { CompleteSetupStepUseCase } from './complete-setup-step.use-case';
import {
  BulkCreateRequestDto,
  BulkCreateResponseDto,
  BulkCreateErrorDto,
  CreatedResourceDto,
  SetupStep,
  BulkRoomDto,
  BulkUpsDto,
  BulkServerDto,
} from '../dto';
import { Room } from '../../../rooms/domain/entities/room.entity';
import { Ups } from '../../../ups/domain/entities/ups.entity';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Ilo } from '../../../ilos/domain/entities/ilo.entity';

@Injectable()
export class BulkCreateUseCase {
  private readonly logger = new Logger(BulkCreateUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly roomRepository: RoomRepositoryInterface,
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly completeSetupStepUseCase: CompleteSetupStepUseCase,
  ) {}

  async execute(dto: BulkCreateRequestDto, userId?: string): Promise<BulkCreateResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const created = {
        rooms: [] as CreatedResourceDto[],
        upsList: [] as CreatedResourceDto[],
        servers: [] as CreatedResourceDto[],
      };

      const idMapping = {
        rooms: {} as Record<string, string>,
        ups: {} as Record<string, string>,
      };

      // Step 1: Create all rooms
      for (const roomData of dto.rooms) {
        const room = await this.createRoom(queryRunner, roomData);
        created.rooms.push({
          id: room.id,
          name: room.name,
          tempId: roomData.tempId,
        });

        if (roomData.tempId) {
          idMapping.rooms[roomData.tempId] = room.id;
        }
      }

      // Step 2: Create all UPS (resolve room IDs)
      for (const upsData of dto.upsList) {
        const roomId = this.resolveId(upsData.roomId, idMapping.rooms);
        const ups = await this.createUps(queryRunner, upsData, roomId);
        created.upsList.push({
          id: ups.id,
          name: ups.name,
          tempId: upsData.tempId,
        });

        if (upsData.tempId) {
          idMapping.ups[upsData.tempId] = ups.id;
        }
      }

      // Step 3: Create all servers (resolve room and UPS IDs)
      for (const serverData of dto.servers) {
        const roomId = this.resolveId(serverData.roomId, idMapping.rooms);
        const upsId = this.resolveId(serverData.upsId, idMapping.ups);
        const server = await this.createServer(
          queryRunner,
          serverData,
          roomId,
          upsId,
        );
        created.servers.push({
          id: server.id,
          name: server.name,
          tempId: serverData.tempId,
        });
      }

      await queryRunner.commitTransaction();

      // Update setup status
      if (userId) {
        await this.completeSetupStepUseCase.execute(SetupStep.REVIEW, userId);
      }

      this.logger.log(
        `Bulk creation completed: ${created.rooms.length} rooms, ${created.upsList.length} UPS, ${created.servers.length} servers`,
      );

      return {
        success: true,
        created,
        idMapping,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Bulk creation failed', error);

      throw new BadRequestException({
        success: false,
        errors: [
          {
            resource: 'room' as const,
            name: 'transaction',
            error: error.message,
          },
        ] as BulkCreateErrorDto[],
      });
    } finally {
      await queryRunner.release();
    }
  }

  private async createRoom(
    queryRunner: QueryRunner,
    roomData: BulkRoomDto,
  ): Promise<Room> {
    const room = new Room();
    room.name = roomData.name;

    // Note: The Room entity doesn't have location, capacity, or coolingType fields
    // These would need to be added to the Room entity if required

    return await queryRunner.manager.save(Room, room);
  }

  private async createUps(
    queryRunner: QueryRunner,
    upsData: BulkUpsDto,
    roomId: string | null,
  ): Promise<Ups> {
    if (!roomId) {
      throw new BadRequestException(
        `Room ID is required for UPS ${upsData.name}`,
      );
    }

    if (!upsData.ip) {
      throw new BadRequestException(
        `IP address is required for UPS ${upsData.name}`,
      );
    }

    const ups = new Ups();
    ups.name = upsData.name;
    ups.ip = upsData.ip;
    ups.roomId = roomId;

    // Note: The Ups entity doesn't have brand, model, capacity, login, password, gracePeriod fields
    // These would need to be added to the Ups entity if required

    return await queryRunner.manager.save(Ups, ups);
  }

  private async createServer(
    queryRunner: QueryRunner,
    serverData: BulkServerDto,
    roomId: string | null,
    upsId: string | null,
  ): Promise<Server> {
    if (!roomId) {
      throw new BadRequestException(
        `Room ID is required for server ${serverData.name}`,
      );
    }

    const server = new Server();
    server.name = serverData.name;
    server.state = serverData.state;
    server.grace_period_on = serverData.grace_period_on;
    server.grace_period_off = serverData.grace_period_off;
    server.adminUrl = serverData.adminUrl;
    server.ip = serverData.ip;
    server.login = serverData.login;
    server.password = serverData.password;
    server.type = serverData.type;
    server.priority = serverData.priority;
    server.roomId = roomId;
    server.upsId = upsId ?? undefined;
    server.groupId = serverData.groupId ?? undefined;

    // Create ILO if provided
    if (
      serverData.ilo_name &&
      serverData.ilo_ip &&
      serverData.ilo_login &&
      serverData.ilo_password
    ) {
      const ilo = new Ilo();
      ilo.name = serverData.ilo_name;
      ilo.ip = serverData.ilo_ip;
      ilo.login = serverData.ilo_login;
      ilo.password = serverData.ilo_password;

      const savedIlo = await queryRunner.manager.save(Ilo, ilo);
      server.ilo = savedIlo;
    }

    return await queryRunner.manager.save(Server, server);
  }

  private resolveId(
    id: string | undefined,
    idMapping: Record<string, string>,
  ): string | null {
    if (!id) {
      return null;
    }

    // Check if it's a temporary ID that needs mapping
    if (id.startsWith('temp_') && idMapping[id]) {
      return idMapping[id];
    }

    // Otherwise, assume it's a real UUID
    return id;
  }
}
