import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  UpsAlertLevel,
  UPSBatteryStatusDto,
} from '../../domain/interfaces/ups-battery-status.interface';
import { UpsTelemetry } from '../../domain/interfaces/ups-telemetry.interface';
import { UpsTelemetryResponseDto } from './ups-telemetry.response.dto';

export class BatteryStatusResponseDto {
  @ApiProperty()
  @IsUUID()
  readonly upsId: string;

  @ApiProperty()
  @IsString()
  readonly ip: string;

  @ApiProperty({
    description: 'Battery time remaining in minutes',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly minutesRemaining: number | null;

  @ApiProperty({
    description: 'Battery time remaining in hours',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly hoursRemaining: number | null;

  @ApiProperty({
    description: 'Battery alert level',
    enum: ['normal', 'low', 'warning', 'critical'],
  })
  @IsString()
  readonly alertLevel: UpsAlertLevel;

  @ApiProperty({ description: 'Human-readable status label' })
  @IsString()
  readonly statusLabel: string;

  @ApiProperty()
  @IsDate()
  readonly timestamp: Date;

  @ApiProperty({
    description: 'Full UPS telemetry, null with a legacy ups_manager',
    type: UpsTelemetryResponseDto,
    nullable: true,
  })
  @IsOptional()
  readonly telemetry: UpsTelemetry | null;

  @ApiProperty({
    description: 'True when the UPS runs on battery, null when unknown',
    type: Boolean,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly onBattery: boolean | null;

  @ApiProperty({
    description: 'Battery charge reported by the device',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  readonly batteryPercentage: number | null;

  @ApiProperty({
    description: 'Output load in percent',
    type: Number,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  readonly loadPercent: number | null;

  constructor(
    data: Omit<
      UPSBatteryStatusDto,
      'telemetry' | 'onBattery' | 'batteryPercentage' | 'loadPercent'
    > &
      Partial<UPSBatteryStatusDto>,
  ) {
    this.upsId = data.upsId;
    this.ip = data.ip;
    this.minutesRemaining = data.minutesRemaining;
    this.hoursRemaining = data.hoursRemaining;
    this.alertLevel = data.alertLevel;
    this.statusLabel = data.statusLabel;
    this.timestamp = data.timestamp;
    this.telemetry = data.telemetry ?? null;
    this.onBattery = data.onBattery ?? null;
    this.batteryPercentage = data.batteryPercentage ?? null;
    this.loadPercent = data.loadPercent ?? null;
  }
}
