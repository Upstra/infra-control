import { IsUUID, IsOptional, ValidateNested, IsArray, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MigrationDestinationDto {
  @ApiProperty({
    description: 'ID of the source server',
    example: 'server-uuid-1',
  })
  @IsUUID()
  sourceServerId: string;

  @ApiPropertyOptional({
    description: 'ID of the destination server (optional)',
    example: 'server-uuid-2',
  })
  @IsOptional()
  @IsUUID()
  destinationServerId?: string;
}

export class SetMigrationDestinationsDto {
  @ApiProperty({
    description: 'Array of migration destinations',
    type: [MigrationDestinationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MigrationDestinationDto)
  destinations: MigrationDestinationDto[];
}

export class ServerInfoDto {
  @ApiProperty({
    description: 'Server ID',
    example: 'server-uuid-1',
  })
  id: string;

  @ApiProperty({
    description: 'Server name',
    example: 'esxi-01',
  })
  name: string;

  @ApiProperty({
    description: 'VMware host MOID',
    example: 'host-123',
  })
  vmwareHostMoid: string;
}

export class MigrationDestinationResponseDto {
  @ApiProperty({
    description: 'Source server information',
    type: ServerInfoDto,
  })
  sourceServer: ServerInfoDto;

  @ApiPropertyOptional({
    description: 'Destination server information (optional)',
    type: ServerInfoDto,
  })
  destinationServer?: ServerInfoDto;
}

export class MigrationDestinationsResponseDto {
  @ApiProperty({
    description: 'Array of configured migration destinations',
    type: [MigrationDestinationResponseDto],
  })
  destinations: MigrationDestinationResponseDto[];

  @ApiProperty({
    description: 'Path to the generated YAML file',
    example: '/home/upstra/ups_manager/plans/migration.yml',
  })
  yamlPath: string;
}

export class SetDestinationsResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Migration destinations configured successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Path to the generated YAML file',
    example: '/home/upstra/ups_manager/plans/migration.yml',
  })
  yamlPath: string;
}

export class RemoveDestinationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Migration destination removed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'ID of the source server',
    example: 'server-uuid-1',
  })
  sourceServerId: string;
}

export class VmMigrationInfoDto {
  @ApiProperty({
    description: 'VM ID',
    example: 'vm-uuid-1',
  })
  id: string;

  @ApiProperty({
    description: 'VM name',
    example: 'web-server-01',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'VMware managed object ID',
    example: 'vm-1001',
  })
  moid?: string;

  @ApiProperty({
    description: 'VM state',
    example: 'powered_on',
  })
  state: string;

  @ApiProperty({
    description: 'Shutdown priority (lower = higher priority)',
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Grace period for startup in seconds',
    example: 30,
  })
  grace_period_on: number;

  @ApiProperty({
    description: 'Grace period for shutdown in seconds',
    example: 60,
  })
  grace_period_off: number;
}

export class ServerVmsDto {
  @ApiProperty({
    description: 'Server information',
    type: ServerInfoDto,
  })
  server: ServerInfoDto;

  @ApiProperty({
    description: 'List of VMs on this server',
    type: [VmMigrationInfoDto],
  })
  vms: VmMigrationInfoDto[];
}

export class VmsForMigrationResponseDto {
  @ApiProperty({
    description: 'Servers with their VMs grouped',
    type: [ServerVmsDto],
  })
  servers: ServerVmsDto[];

  @ApiProperty({
    description: 'Total number of servers',
    example: 5,
  })
  totalServers: number;

  @ApiProperty({
    description: 'Total number of VMs across all servers',
    example: 25,
  })
  totalVms: number;
}
