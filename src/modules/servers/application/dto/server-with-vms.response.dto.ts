import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Server } from '../../domain/entities/server.entity';
import { VmLightDto } from '../../../vms/application/dto/vm.light.dto';

/**
 * Server with VMs response DTO for light server listings
 *
 * @description
 * This DTO provides a lightweight representation of a server with its associated VMs.
 * It includes only essential server information and light VM details for optimal performance.
 *
 * @since 1.0.0
 */
export class ServerWithVmsResponseDto {
  /**
   * Server unique identifier
   *
   * @example "cce1b685-e2bf-4954-9b50-7253797ee8af"
   */
  @ApiProperty({
    description: 'Server unique identifier',
    example: 'cce1b685-e2bf-4954-9b50-7253797ee8af',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly id: string;

  /**
   * Server name
   *
   * @example "ESXi-Server-01"
   */
  @ApiProperty({
    description: 'Server name',
    example: 'ESXi-Server-01',
  })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  /**
   * Server IP address
   *
   * @example "192.168.1.10"
   */
  @ApiProperty({
    description: 'Server IP address',
    example: '192.168.1.10',
  })
  @IsNotEmpty()
  @IsString()
  readonly ip: string;

  /**
   * VMware host MOID (Managed Object ID)
   *
   * @example "host-123"
   */
  @ApiProperty({
    description: 'VMware host MOID (Managed Object ID)',
    example: 'host-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly hostMoid?: string;

  /**
   * Array of VMs associated with this server
   *
   * @example [{"id": "94c93b06-...", "name": "VM-Server1-01", "state": "running"}]
   */
  @ApiProperty({
    description: 'Array of VMs associated with this server',
    type: [VmLightDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VmLightDto)
  readonly vms: VmLightDto[];

  /**
   * Creates a new ServerWithVmsResponseDto instance
   *
   * @param server - The server entity
   * @param vms - Array of VM light DTOs
   */
  constructor(server: Server, vms: VmLightDto[] = []) {
    this.id = server.id;
    this.name = server.name;
    this.ip = server.ip;
    this.hostMoid = server.vmwareHostMoid;
    this.vms = vms;
  }

  /**
   * Static factory method to create ServerWithVmsResponseDto from server entity
   *
   * @param server - The server entity with loaded VMs
   * @returns ServerWithVmsResponseDto instance
   */
  static fromEntity(server: Server): ServerWithVmsResponseDto {
    const vms = server.vms?.map((vm) => VmLightDto.fromEntity(vm)) || [];
    return new ServerWithVmsResponseDto(server, vms);
  }
}
