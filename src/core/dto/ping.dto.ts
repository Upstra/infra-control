import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PingRequestDto {
  @ApiPropertyOptional({ description: 'IP address or hostname to ping' })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ 
    description: 'Timeout in milliseconds', 
    default: 5000,
    minimum: 1000,
    maximum: 30000
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  timeout?: number;
}

export class PingResponseDto {
  @ApiProperty({ description: 'Whether the host is accessible' })
  accessible: boolean;

  @ApiProperty({ description: 'Host that was pinged' })
  host: string;

  @ApiPropertyOptional({ description: 'Response time in milliseconds' })
  responseTime?: number;

  @ApiPropertyOptional({ description: 'Error message if ping failed' })
  error?: string;
}