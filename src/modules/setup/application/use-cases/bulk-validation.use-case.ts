import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { isIP } from 'net';
import {
  ValidationRequestDto,
  ValidationResponseDto,
  ValidationErrorDto,
  ValidationWarningDto,
  ConnectivityResultsDto,
  UpsConnectivityResultDto,
  ServerConnectivityResultDto,
} from '../dto';
import { RoomRepositoryInterface } from '../../../rooms/domain/interfaces/room.repository.interface';
import { UpsRepositoryInterface } from '../../../ups/domain/interfaces/ups.repository.interface';
import { ServerRepositoryInterface } from '../../../servers/domain/interfaces/server.repository.interface';

@Injectable()
export class BulkValidationUseCase {
  private readonly logger = new Logger(BulkValidationUseCase.name);

  constructor(
    private readonly roomRepository: RoomRepositoryInterface,
    private readonly upsRepository: UpsRepositoryInterface,
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  async execute(dto: ValidationRequestDto): Promise<ValidationResponseDto> {
    const errors: ValidationErrorDto[] = [];
    const warnings: ValidationWarningDto[] = [];
    let connectivityResults: ConnectivityResultsDto | undefined;

    // Validate rooms
    await this.validateRooms(dto.resources.rooms, errors, warnings);

    // Validate UPS
    await this.validateUps(dto.resources.upsList, errors, warnings);

    // Validate servers
    await this.validateServers(dto.resources.servers, errors, warnings);

    // Check connectivity if requested
    if (dto.checkConnectivity) {
      connectivityResults = await this.checkConnectivity(dto.resources);
    }

    const valid = errors.length === 0;

    this.logger.log(
      `Validation completed: ${errors.length} errors, ${warnings.length} warnings`,
    );

    return {
      valid,
      errors,
      warnings,
      connectivityResults,
    };
  }

  private async validateRooms(
    rooms: any[],
    errors: ValidationErrorDto[],
    _warnings: ValidationWarningDto[],
  ): Promise<void> {
    const roomNames = new Set<string>();

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];

      // Check for duplicate names in the batch
      if (roomNames.has(room.name)) {
        errors.push({
          resource: 'room',
          index: i,
          field: 'name',
          message: `Duplicate room name '${room.name}' in the batch`,
        });
      }
      roomNames.add(room.name);

      // Check if room already exists in database
      const existingRoom = await this.roomRepository.findOneByField({
        field: 'name',
        value: room.name,
      });

      if (existingRoom) {
        errors.push({
          resource: 'room',
          index: i,
          field: 'name',
          message: `Room with name '${room.name}' already exists`,
        });
      }
    }
  }

  private async validateUps(
    upsList: any[],
    errors: ValidationErrorDto[],
    _warnings: ValidationWarningDto[],
  ): Promise<void> {
    const upsNames = new Set<string>();
    const upsIps = new Set<string>();

    for (let i = 0; i < upsList.length; i++) {
      const ups = upsList[i];

      // Check for duplicate names in the batch
      if (upsNames.has(ups.name)) {
        errors.push({
          resource: 'ups',
          index: i,
          field: 'name',
          message: `Duplicate UPS name '${ups.name}' in the batch`,
        });
      }
      upsNames.add(ups.name);

      // Check for duplicate IPs in the batch
      if (ups.ip && upsIps.has(ups.ip)) {
        errors.push({
          resource: 'ups',
          index: i,
          field: 'ip',
          message: `Duplicate UPS IP '${ups.ip}' in the batch`,
        });
      }
      if (ups.ip) {
        upsIps.add(ups.ip);
      }

      // Check if UPS already exists in database
      const existingUps = await this.upsRepository.findOneByField({
        field: 'name',
        value: ups.name,
      });

      if (existingUps) {
        errors.push({
          resource: 'ups',
          index: i,
          field: 'name',
          message: `UPS with name '${ups.name}' already exists`,
        });
      }
    }
  }

  private async validateServers(
    servers: any[],
    errors: ValidationErrorDto[],
    warnings: ValidationWarningDto[],
  ): Promise<void> {
    const serverNames = new Set<string>();
    const serverIps = new Set<string>();
    const iloIps = new Set<string>();

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];

      // Check for duplicate names in the batch
      if (serverNames.has(server.name)) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'name',
          message: `Duplicate server name '${server.name}' in the batch`,
        });
      }
      serverNames.add(server.name);

      // Check for duplicate IPs in the batch
      if (serverIps.has(server.ip)) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'ip',
          message: `Duplicate server IP '${server.ip}' in the batch`,
        });
      }
      serverIps.add(server.ip);

      // Check for duplicate ILO IPs in the batch
      if (server.ilo_ip && iloIps.has(server.ilo_ip)) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'ilo_ip',
          message: `Duplicate ILO IP '${server.ilo_ip}' in the batch`,
        });
      }
      if (server.ilo_ip) {
        iloIps.add(server.ilo_ip);
      }

      // Check if server already exists in database
      const existingServer = await this.serverRepository.findOneByField({
        field: 'name',
        value: server.name,
      });

      if (existingServer) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'name',
          message: `Server with name '${server.name}' already exists`,
        });
      }

      // Validate grace periods
      if (server.grace_period_on < 0) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'grace_period_on',
          message: 'Grace period on must be positive',
        });
      }

      if (server.grace_period_off < 0) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'grace_period_off',
          message: 'Grace period off must be positive',
        });
      }

      // Validate priority
      if (server.priority < 0) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'priority',
          message: 'Priority must be positive',
        });
      }

      // Warning for high priority values
      if (server.priority > 10) {
        warnings.push({
          resource: 'server',
          index: i,
          message:
            'Priority value is very high (> 10), lower values have higher priority',
        });
      }

      // Validate ILO configuration
      if (server.ilo_ip && (!server.ilo_login || !server.ilo_password)) {
        errors.push({
          resource: 'server',
          index: i,
          field: 'ilo_ip',
          message: 'ILO IP provided but credentials are missing',
        });
      }
    }
  }

  private async checkConnectivity(
    resources: any,
  ): Promise<ConnectivityResultsDto> {
    const upsResults: UpsConnectivityResultDto[] = [];
    const serverResults: ServerConnectivityResultDto[] = [];

    // Check UPS connectivity
    for (let i = 0; i < resources.upsList.length; i++) {
      const ups = resources.upsList[i];
      if (ups.ip) {
        const accessible = await this.pingHost(ups.ip);
        upsResults.push({
          index: i,
          ip: ups.ip,
          accessible,
        });
      }
    }

    // Check server connectivity
    for (let i = 0; i < resources.servers.length; i++) {
      const server = resources.servers[i];
      const result: ServerConnectivityResultDto = {
        index: i,
        ip: server.ip,
        accessible: await this.pingHost(server.ip),
      };

      if (server.ilo_ip) {
        result.iloIp = server.ilo_ip;
        result.iloAccessible = await this.pingHost(server.ilo_ip);
      }

      serverResults.push(result);
    }

    return {
      ups: upsResults,
      servers: serverResults,
    };
  }

  private async pingHost(ip: string): Promise<boolean> {
    if (!isIP(ip)) {
      this.logger.warn(`Invalid IP address format: ${ip}`);
      return false;
    }

    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const args = isWindows
        ? ['-n', '1', '-w', '5000', ip]
        : ['-c', '1', '-W', '5', ip];

      const child = spawn('ping', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 10000,
      });

      let resolved = false;

      const handleResult = (success: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(success);
        }
      };

      child.on('exit', (code) => {
        handleResult(code === 0);
      });

      child.on('error', () => {
        handleResult(false);
      });

      child.on('timeout', () => {
        child.kill();
        handleResult(false);
      });
    });
  }
}
