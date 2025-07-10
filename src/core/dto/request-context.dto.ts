import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Request context DTO for capturing audit and security information
 */
export class RequestContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  correlationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  constructor(partial?: Partial<RequestContextDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create RequestContextDto from Express request object
   */
  static fromRequest(req: any): RequestContextDto {
    return new RequestContextDto({
      ipAddress: req.ip ?? req.socket?.remoteAddress ?? 'unknown',
      userAgent: req.get('User-Agent') ?? 'unknown',
      sessionId: req.sessionID,
    });
  }

  /**
   * Create RequestContextDto for testing
   */
  static forTesting(overrides?: Partial<RequestContextDto>): RequestContextDto {
    return new RequestContextDto({
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      correlationId: 'test-correlation-id',
      ...overrides,
    });
  }
}
