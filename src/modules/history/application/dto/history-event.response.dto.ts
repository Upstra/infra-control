import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsDate, IsObject } from 'class-validator';
import { HistoryEvent } from '../../domain/entities/history-event.entity';
import { UserResponseDto } from '@/modules/users/application/dto/user.response.dto';
import { Type } from 'class-transformer';

export class HistoryEventResponseDto {
  @ApiProperty()
  @IsUUID()
  readonly id: string;

  @ApiProperty()
  @IsString()
  readonly entity: string;

  @ApiProperty()
  @IsString()
  readonly entityId: string;

  @ApiProperty()
  @IsString()
  readonly action: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  readonly userId?: string;

  @ApiProperty()
  @IsDate()
  readonly createdAt: Date;

  @ApiProperty({ required: false, type: () => UserResponseDto })
  @IsOptional()
  @Type(() => UserResponseDto)
  readonly user?: UserResponseDto;

  @ApiProperty({ description: 'Previous state of the entity', required: false })
  @IsObject()
  @IsOptional()
  readonly oldValue?: Record<string, any>;

  @ApiProperty({ description: 'New state of the entity', required: false })
  @IsObject()
  @IsOptional()
  readonly newValue?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata and context', required: false })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, any>;

  @ApiProperty({ description: 'IP address of the user performing the action', required: false })
  @IsString()
  @IsOptional()
  readonly ipAddress?: string;

  @ApiProperty({ description: 'User agent of the client', required: false })
  @IsString()
  @IsOptional()
  readonly userAgent?: string;

  @ApiProperty({ description: 'Correlation ID for tracking related events', required: false })
  @IsString()
  @IsOptional()
  readonly correlationId?: string;

  constructor(event: HistoryEvent) {
    this.id = event.id;
    this.entity = event.entity;
    this.entityId = event.entityId;
    this.action = event.action;
    this.userId = event.userId;
    this.createdAt = event.createdAt;
    this.oldValue = event.oldValue;
    this.newValue = event.newValue;
    this.metadata = event.metadata;
    this.ipAddress = event.ipAddress;
    this.userAgent = event.userAgent;
    this.correlationId = event.correlationId;
    if (event.user) {
      this.user = new UserResponseDto(event.user);
    }
  }
}
