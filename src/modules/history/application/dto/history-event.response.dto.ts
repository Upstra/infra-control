import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsDate } from 'class-validator';
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

  constructor(event: HistoryEvent) {
    this.id = event.id;
    this.entity = event.entity;
    this.entityId = event.entityId;
    this.action = event.action;
    this.userId = event.userId;
    this.createdAt = event.createdAt;
    if (event.user) {
      this.user = new UserResponseDto(event.user);
    }
  }
}
