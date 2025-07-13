import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  IsIP,
  Allow,
} from 'class-validator';

/**
 * DTO for creating a room in bulk operation
 */
export class BulkRoomDto {
  @ApiProperty({
    description: 'Room name',
    example: 'Server Room 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Temporary ID from frontend for relationship mapping',
    example: 'temp_room_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  tempId?: string;

  @Allow()
  @IsOptional()
  id?: any;

  @Allow()
  @IsOptional()
  status?: any;
}

/**
 * DTO for creating a UPS in bulk operation
 */
export class BulkUpsDto {
  @ApiProperty({
    description: 'UPS name',
    example: 'UPS-01',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Room ID (can be temporary ID from frontend)',
    example: 'temp_room_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiProperty({
    description: 'UPS IP address',
    example: '192.168.1.100',
    required: false,
  })
  @IsIP()
  @IsOptional()
  ip?: string;

  @ApiProperty({
    description: 'Temporary ID from frontend for relationship mapping',
    example: 'temp_ups_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  tempId?: string;

  @Allow()
  @IsOptional()
  id?: any;

  @Allow()
  @IsOptional()
  status?: any;
}

/**
 * DTO for creating a server in bulk operation
 */
export class BulkServerDto {
  @ApiProperty({
    description: 'Server name',
    example: 'WEB-01',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Server state',
    example: 'stopped',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'Grace period when turning on (seconds)',
    example: 30,
  })
  @IsNumber()
  grace_period_on: number;

  @ApiProperty({
    description: 'Grace period when turning off (seconds)',
    example: 30,
  })
  @IsNumber()
  grace_period_off: number;

  @ApiProperty({
    description: 'Administration URL',
    example: 'https://192.168.1.10:443',
  })
  @IsString()
  @IsNotEmpty()
  adminUrl: string;

  @ApiProperty({
    description: 'Server IP address',
    example: '192.168.1.10',
  })
  @IsIP()
  @IsNotEmpty()
  ip: string;

  @ApiProperty({
    description: 'Admin login',
    example: 'root',
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({
    description: 'Admin password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Server type',
    example: 'physical',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Priority in group/rack (lower = higher priority)',
    example: 1,
  })
  @IsNumber()
  priority: number;

  @ApiProperty({
    description: 'Room ID (can be temporary ID from frontend)',
    example: 'temp_room_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  roomId?: string;

  @ApiProperty({
    description: 'UPS ID (can be temporary ID from frontend)',
    example: 'temp_ups_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  upsId?: string;

  @ApiProperty({
    description: 'Group ID',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiProperty({
    description: 'ILO name',
    example: 'ILO-WEB-01',
    required: false,
  })
  @IsString()
  @IsOptional()
  ilo_name?: string;

  @ApiProperty({
    description: 'ILO IP address',
    example: '192.168.1.11',
    required: false,
  })
  @IsIP()
  @IsOptional()
  ilo_ip?: string;

  @ApiProperty({
    description: 'ILO login',
    example: 'admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  ilo_login?: string;

  @ApiProperty({
    description: 'ILO password',
    required: false,
  })
  @IsString()
  @IsOptional()
  ilo_password?: string;

  @ApiProperty({
    description: 'Temporary ID from frontend for relationship mapping',
    example: 'temp_server_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  tempId?: string;

  @Allow()
  @IsOptional()
  id?: any;

  @Allow()
  @IsOptional()
  status?: any;
}

/**
 * ID mapping for relationships between temporary and real IDs
 */
export class IdMappingDto {
  @ApiProperty({
    description: 'Map of temporary room IDs to room names',
    example: { temp_room_1: 'Server Room 1' },
  })
  rooms: Record<string, string>;

  @ApiProperty({
    description: 'Map of temporary UPS IDs to UPS names',
    example: { temp_ups_1: 'UPS-01' },
  })
  ups: Record<string, string>;
}

/**
 * Request DTO for bulk create operation
 */
export class BulkCreateRequestDto {
  @ApiProperty({
    description: 'Array of rooms to create',
    type: [BulkRoomDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkRoomDto)
  rooms: BulkRoomDto[];

  @ApiProperty({
    description: 'Array of UPS devices to create',
    type: [BulkUpsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsDto)
  upsList: BulkUpsDto[];

  @ApiProperty({
    description: 'Array of servers to create',
    type: [BulkServerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkServerDto)
  servers: BulkServerDto[];

  @ApiProperty({
    description: 'ID mapping for relationships',
    type: IdMappingDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IdMappingDto)
  idMapping?: IdMappingDto;
}

/**
 * Created resource response
 */
export class CreatedResourceDto {
  @ApiProperty({
    description: 'Resource ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Resource name',
    example: 'Server Room 1',
  })
  name: string;

  @ApiProperty({
    description: 'Temporary ID from frontend',
    example: 'temp_room_1',
    required: false,
  })
  tempId?: string;
}

/**
 * Bulk creation error
 */
export class BulkCreateErrorDto {
  @ApiProperty({
    description: 'Resource type',
    enum: ['room', 'ups', 'server'],
  })
  resource: 'room' | 'ups' | 'server';

  @ApiProperty({
    description: 'Resource name',
    example: 'Server Room 1',
  })
  name: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Room with this name already exists',
  })
  error: string;
}

/**
 * Response DTO for bulk create operation
 */
export class BulkCreateResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Created resources',
  })
  created: {
    rooms: CreatedResourceDto[];
    upsList: CreatedResourceDto[];
    servers: CreatedResourceDto[];
  };

  @ApiProperty({
    description: 'Errors occurred during creation',
    type: [BulkCreateErrorDto],
    required: false,
  })
  errors?: BulkCreateErrorDto[];

  @ApiProperty({
    description: 'Mapping of temporary IDs to real IDs',
  })
  idMapping: {
    rooms: Record<string, string>;
    ups: Record<string, string>;
  };
}
