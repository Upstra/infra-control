import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BulkCreateRequestDto, BulkCreateResponseDto } from './bulk-create.dto';

/**
 * Request DTO for bulk create with discovery operation
 */
export class BulkCreateWithDiscoveryRequestDto extends BulkCreateRequestDto {
  @ApiProperty({
    description: 'Enable automatic VMware discovery after creation',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  enableDiscovery?: boolean;

  @ApiProperty({
    description: 'Custom discovery session ID for WebSocket connection',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsString()
  @IsOptional()
  discoverySessionId?: string;
}

/**
 * Response DTO for bulk create with discovery operation
 */
export class BulkCreateWithDiscoveryResponseDto extends BulkCreateResponseDto {
  @ApiProperty({
    description: 'Discovery session ID for WebSocket connection',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  discoverySessionId?: string;

  @ApiProperty({
    description: 'Whether VMware discovery was triggered',
    example: true,
    required: false,
  })
  discoveryTriggered?: boolean;

  @ApiProperty({
    description: 'Number of VMware servers being discovered',
    example: 3,
    required: false,
  })
  vmwareServerCount?: number;
}