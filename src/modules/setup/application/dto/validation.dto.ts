import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { BulkRoomDto, BulkUpsDto, BulkServerDto } from './bulk-create.dto';

/**
 * Resources to validate
 */
export class ValidationResourcesDto {
  @ApiProperty({
    description: 'Array of rooms to validate',
    type: [BulkRoomDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkRoomDto)
  rooms: BulkRoomDto[];

  @ApiProperty({
    description: 'Array of UPS devices to validate',
    type: [BulkUpsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsDto)
  upsList: BulkUpsDto[];

  @ApiProperty({
    description: 'Array of servers to validate',
    type: [BulkServerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkServerDto)
  servers: BulkServerDto[];
}

/**
 * Request DTO for validation
 */
export class ValidationRequestDto {
  @ApiProperty({
    description: 'Resources to validate',
    type: ValidationResourcesDto,
  })
  @ValidateNested()
  @Type(() => ValidationResourcesDto)
  resources: ValidationResourcesDto;

  @ApiProperty({
    description: 'Test connectivity for servers and UPS',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  checkConnectivity?: boolean;
}

/**
 * Validation error detail
 */
export class ValidationErrorDto {
  @ApiProperty({
    description: 'Resource type',
    enum: ['room', 'ups', 'server'],
  })
  @IsEnum(['room', 'ups', 'server'])
  resource: 'room' | 'ups' | 'server';

  @ApiProperty({
    description: 'Index in the array',
    example: 0,
  })
  @IsNumber()
  index: number;

  @ApiProperty({
    description: 'Field with error',
    example: 'name',
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Name is required',
  })
  @IsString()
  message: string;
}

/**
 * Validation warning
 */
export class ValidationWarningDto {
  @ApiProperty({
    description: 'Resource type',
    enum: ['room', 'ups', 'server'],
  })
  @IsEnum(['room', 'ups', 'server'])
  resource: 'room' | 'ups' | 'server';

  @ApiProperty({
    description: 'Index in the array',
    example: 0,
  })
  @IsNumber()
  index: number;

  @ApiProperty({
    description: 'Warning message',
    example: 'Room capacity might be insufficient for the number of servers',
  })
  @IsString()
  message: string;
}

/**
 * Connectivity test result for UPS
 */
export class UpsConnectivityResultDto {
  @ApiProperty({
    description: 'Index in the array',
    example: 0,
  })
  @IsNumber()
  index: number;

  @ApiProperty({
    description: 'IP address tested',
    example: '192.168.1.100',
  })
  @IsString()
  ip: string;

  @ApiProperty({
    description: 'Whether the UPS is accessible',
    example: true,
  })
  @IsBoolean()
  accessible: boolean;
}

/**
 * Connectivity test result for server
 */
export class ServerConnectivityResultDto {
  @ApiProperty({
    description: 'Index in the array',
    example: 0,
  })
  @IsNumber()
  index: number;

  @ApiProperty({
    description: 'IP address tested',
    example: '192.168.1.10',
  })
  @IsString()
  ip: string;

  @ApiProperty({
    description: 'Whether the server is accessible',
    example: true,
  })
  @IsBoolean()
  accessible: boolean;

  @ApiProperty({
    description: 'ILO IP address tested',
    example: '192.168.1.11',
    required: false,
  })
  @IsString()
  @IsOptional()
  iloIp?: string;

  @ApiProperty({
    description: 'Whether the ILO is accessible',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  iloAccessible?: boolean;
}

/**
 * Connectivity test results
 */
export class ConnectivityResultsDto {
  @ApiProperty({
    description: 'UPS connectivity results',
    type: [UpsConnectivityResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsConnectivityResultDto)
  ups: UpsConnectivityResultDto[];

  @ApiProperty({
    description: 'Server connectivity results',
    type: [ServerConnectivityResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServerConnectivityResultDto)
  servers: ServerConnectivityResultDto[];
}

/**
 * Response DTO for validation
 */
export class ValidationResponseDto {
  @ApiProperty({
    description: 'Whether the configuration is valid',
    example: true,
  })
  @IsBoolean()
  valid: boolean;

  @ApiProperty({
    description: 'Validation errors',
    type: [ValidationErrorDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationErrorDto)
  errors: ValidationErrorDto[];

  @ApiProperty({
    description: 'Validation warnings',
    type: [ValidationWarningDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationWarningDto)
  warnings: ValidationWarningDto[];

  @ApiProperty({
    description: 'Connectivity test results',
    type: ConnectivityResultsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectivityResultsDto)
  connectivityResults?: ConnectivityResultsDto;
}