import { ApiProperty } from '@nestjs/swagger';

export class VmsByHealthDto {
  @ApiProperty({ example: 140 })
  up: number;

  @ApiProperty({ example: 6 })
  degraded: number;

  @ApiProperty({ example: 3 })
  down: number;

  @ApiProperty({ example: 2 })
  unknown: number;
}

export class OpenAlertsCountDto {
  @ApiProperty({ example: 1 })
  critical: number;

  @ApiProperty({ example: 3 })
  warning: number;

  @ApiProperty({ example: 0 })
  info: number;
}

export class InfrastructureKpisDto {
  @ApiProperty({ example: 4 })
  hostsTotal: number;

  @ApiProperty({ example: 4 })
  hostsConnected: number;

  @ApiProperty({ type: VmsByHealthDto })
  vmsByHealth: VmsByHealthDto;

  @ApiProperty({ type: Number, nullable: true, example: 5480 })
  totalPowerW: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 9000,
    description: "null dès qu'un onduleur n'a pas de puissance nominale",
  })
  totalCapacityW: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 31 })
  maxInletC: number | null;

  @ApiProperty({ type: String, nullable: true })
  maxInletRoomId: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'srv-b2-03' })
  maxInletServerName: string | null;

  @ApiProperty({ example: 1 })
  upsOnBattery: number;

  @ApiProperty({ type: OpenAlertsCountDto })
  openAlerts: OpenAlertsCountDto;
}
