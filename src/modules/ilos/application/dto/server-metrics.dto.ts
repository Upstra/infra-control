import { ApiProperty } from '@nestjs/swagger';

export class ServerMetricsDto {
  @ApiProperty({ description: 'CPU usage percentage', required: false })
  cpuUsage?: number;

  @ApiProperty({ description: 'Memory usage in MB', required: false })
  memoryUsage?: number;

  @ApiProperty({ description: 'Power state of the server', required: false })
  powerState?: string;

  @ApiProperty({ description: 'Server uptime in seconds', required: false })
  uptime?: number;
}
