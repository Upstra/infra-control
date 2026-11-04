import { ApiProperty } from '@nestjs/swagger';

export class UpsTelemetryDeviceResponseDto {
  @ApiProperty({ type: String, nullable: true })
  manufacturer: string | null;

  @ApiProperty({ type: String, nullable: true })
  model: string | null;

  @ApiProperty({ type: String, nullable: true })
  serial: string | null;

  @ApiProperty({ type: String, nullable: true })
  firmware: string | null;
}

export class UpsTelemetryStatusResponseDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Raw device status (e.g. "OB DISCHRG")',
  })
  raw: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  onBattery: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  lowBattery: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  charging: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  onBypass: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  overload: boolean | null;

  @ApiProperty({ type: Boolean, nullable: true })
  replaceBattery: boolean | null;
}

export class UpsTelemetryBatteryResponseDto {
  @ApiProperty({ type: Number, nullable: true })
  chargePercent: number | null;

  @ApiProperty({ type: Number, nullable: true })
  runtimeSeconds: number | null;

  @ApiProperty({ type: Number, nullable: true })
  voltage: number | null;

  @ApiProperty({ type: Number, nullable: true })
  temperatureC: number | null;

  @ApiProperty({ type: String, nullable: true })
  lastTestResult: string | null;

  @ApiProperty({ type: String, nullable: true })
  lastTestAt: string | null;
}

export class UpsTelemetryElectricalResponseDto {
  @ApiProperty({ type: Number, nullable: true })
  voltage: number | null;

  @ApiProperty({ type: Number, nullable: true })
  frequencyHz: number | null;
}

export class UpsTelemetryLoadResponseDto {
  @ApiProperty({ type: Number, nullable: true })
  percent: number | null;

  @ApiProperty({ type: Number, nullable: true })
  realPowerW: number | null;

  @ApiProperty({ type: Number, nullable: true })
  nominalRealPowerW: number | null;
}

export class UpsTelemetryResponseDto {
  @ApiProperty({ example: 'nut' })
  source: string;

  @ApiProperty({ example: '2026-11-04T20:01:44.000Z' })
  collectedAt: string;

  @ApiProperty({ type: UpsTelemetryDeviceResponseDto })
  device: UpsTelemetryDeviceResponseDto;

  @ApiProperty({ type: UpsTelemetryStatusResponseDto })
  status: UpsTelemetryStatusResponseDto;

  @ApiProperty({ type: UpsTelemetryBatteryResponseDto })
  battery: UpsTelemetryBatteryResponseDto;

  @ApiProperty({ type: UpsTelemetryElectricalResponseDto })
  input: UpsTelemetryElectricalResponseDto;

  @ApiProperty({ type: UpsTelemetryElectricalResponseDto })
  output: UpsTelemetryElectricalResponseDto;

  @ApiProperty({ type: UpsTelemetryLoadResponseDto })
  load: UpsTelemetryLoadResponseDto;

  @ApiProperty({ type: Number, nullable: true })
  temperatureC: number | null;
}
