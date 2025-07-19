import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { BulkRoomDto, BulkUpsDto, BulkServerDto } from './bulk-create.dto';

/**
 * Template type enum
 */
export enum TemplateType {
  PREDEFINED = 'predefined',
  CUSTOM = 'custom',
  SHARED = 'shared',
}

/**
 * Template configuration
 */
export class TemplateConfigurationDto {
  @ApiProperty({
    description: 'Array of room templates',
    type: [BulkRoomDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkRoomDto)
  rooms: Partial<BulkRoomDto>[];

  @ApiProperty({
    description: 'Array of UPS templates',
    type: [BulkUpsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsDto)
  upsList: Partial<BulkUpsDto>[];

  @ApiProperty({
    description: 'Array of server templates',
    type: [BulkServerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkServerDto)
  servers: Partial<BulkServerDto>[];
}

/**
 * Request DTO for creating a template
 */
export class CreateTemplateRequestDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Small Data Center',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'Template for small data center with 2 rooms and redundant UPS',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Template configuration',
    type: TemplateConfigurationDto,
  })
  @ValidateNested()
  @Type(() => TemplateConfigurationDto)
  configuration: TemplateConfigurationDto;
}

/**
 * Template response DTO
 */
export class TemplateResponseDto {
  @ApiProperty({
    description: 'Template ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Template name',
    example: 'Small Data Center',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Template description',
    example: 'Template for small data center with 2 rooms and redundant UPS',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Template type',
    enum: TemplateType,
    example: TemplateType.CUSTOM,
  })
  @IsEnum(TemplateType)
  type: TemplateType;

  @ApiProperty({
    description: 'Template configuration',
    type: TemplateConfigurationDto,
  })
  @ValidateNested()
  @Type(() => TemplateConfigurationDto)
  configuration: TemplateConfigurationDto;

  @ApiProperty({
    description: 'Creation date',
    example: new Date(),
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'User who created the template',
    example: 'admin@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  createdBy?: string;
}

/**
 * Response DTO for template list
 */
export class TemplateListResponseDto {
  @ApiProperty({
    description: 'List of available templates',
    type: [TemplateResponseDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateResponseDto)
  templates: TemplateResponseDto[];
}
