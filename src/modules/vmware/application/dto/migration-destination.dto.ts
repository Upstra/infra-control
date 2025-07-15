import { IsUUID, IsOptional, ValidateNested, IsArray } from 'class-validator';
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