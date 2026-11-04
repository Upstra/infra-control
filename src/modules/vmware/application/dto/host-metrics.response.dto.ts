import { ApiProperty } from '@nestjs/swagger';

export class HostMetricsResponseDto {
  @ApiProperty({ example: 'host-33' })
  moid: string;

  @ApiProperty({ type: String, nullable: true })
  name: string | null;

  @ApiProperty({ type: String, nullable: true })
  serverId: string | null;

  @ApiProperty({ type: String, nullable: true })
  upsId: string | null;

  @ApiProperty({ enum: ['up', 'degraded', 'down', 'unknown'] })
  health: 'up' | 'degraded' | 'down' | 'unknown';

  @ApiProperty({ type: String, nullable: true })
  connectionState: string | null;

  @ApiProperty({ type: String, nullable: true })
  powerState: string | null;

  @ApiProperty({ type: Boolean, nullable: true })
  maintenance: boolean | null;

  @ApiProperty({ type: Number, nullable: true })
  cpuPercent: number | null;

  @ApiProperty({ type: Number, nullable: true })
  memoryPercent: number | null;

  @ApiProperty({ type: Number, nullable: true })
  uptimeSeconds: number | null;

  @ApiProperty()
  metricsAt: string;
}
