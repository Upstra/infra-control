import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class BatteryStatusResponseDto {
  @ApiProperty()
  @IsUUID()
  readonly upsId: string;

  @ApiProperty()
  @IsString()
  readonly ip: string;

  @ApiProperty({ description: 'Battery time remaining in minutes' })
  @IsNumber()
  @Min(0)
  readonly minutesRemaining: number;

  @ApiProperty({ description: 'Battery time remaining in hours' })
  @IsNumber()
  @Min(0)
  readonly hoursRemaining: number;

  @ApiProperty({
    description: 'Battery alert level',
    enum: ['normal', 'low', 'warning', 'critical'],
  })
  @IsString()
  readonly alertLevel: 'normal' | 'low' | 'warning' | 'critical';

  @ApiProperty({ description: 'Human-readable status label' })
  @IsString()
  readonly statusLabel: string;

  @ApiProperty()
  @IsDate()
  readonly timestamp: Date;

  constructor(data: {
    upsId: string;
    ip: string;
    minutesRemaining: number;
    hoursRemaining: number;
    alertLevel: 'normal' | 'low' | 'warning' | 'critical';
    statusLabel: string;
    timestamp: Date;
  }) {
    this.upsId = data.upsId;
    this.ip = data.ip;
    this.minutesRemaining = data.minutesRemaining;
    this.hoursRemaining = data.hoursRemaining;
    this.alertLevel = data.alertLevel;
    this.statusLabel = data.statusLabel;
    this.timestamp = data.timestamp;
  }
}
