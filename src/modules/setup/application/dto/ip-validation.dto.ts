import { ApiProperty } from '@nestjs/swagger';
import { IsIP, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for validating IP address availability
 */
export class IpValidationRequestDto {
  @ApiProperty({
    description: 'IP address to validate',
    example: '192.168.1.100',
  })
  @IsIP()
  @IsNotEmpty()
  ip: string;

  @ApiProperty({
    description: 'Resource type for validation context',
    example: 'ups',
    enum: ['ups', 'server', 'ilo'],
  })
  @IsString()
  @IsNotEmpty()
  resourceType: 'ups' | 'server' | 'ilo';

  @ApiProperty({
    description: 'Resource ID to exclude from validation (for updates)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  excludeId?: string;
}

/**
 * DTO for validating resource name availability
 */
export class NameValidationRequestDto {
  @ApiProperty({
    description: 'Resource name to validate',
    example: 'UPS-Primary',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Resource type for validation context',
    example: 'ups',
    enum: ['room', 'ups', 'server'],
  })
  @IsString()
  @IsNotEmpty()
  resourceType: 'room' | 'ups' | 'server';

  @ApiProperty({
    description: 'Resource ID to exclude from validation (for updates)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  excludeId?: string;
}

/**
 * Response DTO for IP validation
 */
export class IpValidationResponseDto {
  @ApiProperty({
    description: 'Whether the IP address already exists',
    example: true,
  })
  exists: boolean;

  @ApiProperty({
    description: 'Resource that conflicts with this IP',
    example: 'UPS "DC1-UPS-01"',
    required: false,
  })
  conflictsWith?: string;
}

/**
 * Response DTO for name validation
 */
export class NameValidationResponseDto {
  @ApiProperty({
    description: 'Whether the name already exists',
    example: false,
  })
  exists: boolean;

  @ApiProperty({
    description: 'Resource that conflicts with this name',
    example: 'Server "PROD-SRV-01"',
    required: false,
  })
  conflictsWith?: string;
}
