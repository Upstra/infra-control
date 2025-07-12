import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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