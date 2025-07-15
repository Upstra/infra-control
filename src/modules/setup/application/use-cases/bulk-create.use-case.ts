import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { RoomRepositoryInterface } from '../../../rooms/domain/interfaces/room.repository.interface';
import { UpsRepositoryInterface } from '../../../ups/domain/interfaces/ups.repository.interface';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';
import {
  BulkCreateRequestDto,
  BulkCreateResponseDto,
  BulkCreateErrorDto,
  CreatedResourceDto,
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
    @Inject('RoomRepositoryInterface')
    private readonly roomRepository: RoomRepositoryInterface,
    @Inject('UpsRepositoryInterface')
    private readonly upsRepository: UpsRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(dto: BulkCreateRequestDto): Promise<BulkCreateResponseDto> {
    this.validateDependencies(dto);

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

      for (const roomData of dto.rooms) {
        const room = await this.createRoom(queryRunner, roomData);

        const tempId =
          roomData.tempId ?? (roomData as any).id ?? `room_${room.id}`;

        created.rooms.push({
          id: room.id,
          name: room.name,
          tempId: tempId,
        });

        idMapping.rooms[tempId] = room.id;
      }

      for (const upsData of dto.upsList) {
        const roomId = this.resolveId(upsData.roomId, idMapping.rooms);
        const ups = await this.createUps(queryRunner, upsData, roomId);

        const tempId = upsData.tempId ?? (upsData as any).id ?? `ups_${ups.id}`;

        created.upsList.push({
          id: ups.id,
          name: ups.name,
          tempId: tempId,
        });

        idMapping.ups[tempId] = ups.id;
      }

      for (const serverData of dto.servers) {
        const roomId = this.resolveId(serverData.roomId, idMapping.rooms);
        const upsId = this.resolveId(serverData.upsId, idMapping.ups);
        const server = await this.createServer(
          queryRunner,
          serverData,
          roomId,
          upsId,
        );

        const tempId =
          serverData.tempId ?? (serverData as any).id ?? `server_${server.id}`;

        created.servers.push({
          id: server.id,
          name: server.name,
          tempId: tempId,
        });
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Bulk creation completed: ${created.rooms.length} rooms, ${created.upsList.length} UPS, ${created.servers.length} servers`,
      );

      return {
        success: true,
        created,
        idMapping,
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error('Bulk creation failed', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.code && typeof error.code === 'string') {
        const errorMessage = this.parseDbError(error);

        throw new BadRequestException({
          success: false,
          errors: [
            {
              resource: this.getResourceFromError(error) as any,
              name: this.getResourceNameFromError(error),
              error: errorMessage,
            },
          ] as BulkCreateErrorDto[],
        });
      }

      throw new BadRequestException({
        success: false,
        errors: [
          {
            resource: 'room' as const,
            name: 'transaction',
            error: error.message || 'An unexpected error occurred',
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

    if (serverData.type === 'vcenter') {
      if (
        serverData.ilo_name ||
        serverData.ilo_ip ||
        serverData.ilo_login ||
        serverData.ilo_password
      ) {
        throw new BadRequestException(
          `vCenter server ${serverData.name} should not have iLO configuration`,
        );
      }
    } else {
      if (
        !serverData.ilo_name ||
        !serverData.ilo_ip ||
        !serverData.ilo_login ||
        !serverData.ilo_password
      ) {
        throw new BadRequestException(
          `iLO configuration (name, IP, login, password) is required for ESXi server ${serverData.name}`,
        );
      }

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

    if (id.startsWith('temp_')) {
      const mappedId = idMapping[id];
      if (!mappedId) {
        throw new BadRequestException(
          `Temporary ID ${id} not found in mapping. This suggests a dependency issue.`,
        );
      }
      return mappedId;
    }

    return id;
  }

  /**
   * Validate that all referenced tempIds exist in the request
   */
  private validateDependencies(dto: BulkCreateRequestDto): void {
    const roomTempIds = new Set(
      dto.rooms.map((r) => r.tempId ?? (r as any).id).filter(Boolean),
    );
    const upsTempIds = new Set(
      dto.upsList.map((u) => u.tempId ?? (u as any).id).filter(Boolean),
    );

    for (const ups of dto.upsList) {
      if (
        ups.roomId &&
        ups.roomId.startsWith('temp_') &&
        !roomTempIds.has(ups.roomId)
      ) {
        throw new BadRequestException(
          `UPS "${ups.name}" references room tempId "${ups.roomId}" which doesn't exist in the request`,
        );
      }
    }

    for (const server of dto.servers) {
      if (
        server.roomId &&
        server.roomId.startsWith('temp_') &&
        !roomTempIds.has(server.roomId)
      ) {
        throw new BadRequestException(
          `Server "${server.name}" references room tempId "${server.roomId}" which doesn't exist in the request`,
        );
      }
      if (
        server.upsId &&
        server.upsId.startsWith('temp_') &&
        !upsTempIds.has(server.upsId)
      ) {
        throw new BadRequestException(
          `Server "${server.name}" references UPS tempId "${server.upsId}" which doesn't exist in the request`,
        );
      }
    }
  }

  private parseDbError(error: any): string {
    if (error.code === '23505') {
      if (error.detail) {
        const match = error.detail.match(/Key \((\w+)\)=\(([^)]+)\)/);
        if (match) {
          const field = match[1];
          const value = match[2];
          return `${field.toUpperCase()} '${value}' already exists`;
        }
      }
      return 'This resource already exists (duplicate value)';
    }

    if (error.code === '23502') {
      return 'Required field is missing';
    }

    if (error.code === '23503') {
      return 'Invalid reference to related resource';
    }

    if (error.code === '22001') {
      return 'One or more values are too long';
    }

    return error.message || 'An unexpected error occurred during creation';
  }

  private getResourceFromError(error: any): string {
    if (error.table) {
      return error.table;
    }

    if (error.query && typeof error.query === 'string') {
      const match = error.query.match(/INSERT INTO "(\w+)"/);
      if (match) {
        return match[1];
      }
    }

    return 'unknown';
  }

  private getResourceNameFromError(error: any): string {
    if (error.parameters && error.parameters[0]) {
      return error.parameters[0];
    }

    return 'unknown';
  }
}
