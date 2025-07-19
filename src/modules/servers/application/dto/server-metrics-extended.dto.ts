import { ApiProperty } from '@nestjs/swagger';

export class ServerMetricsExtendedDto {
  @ApiProperty({ description: 'Power state of the server' })
  powerState: string;

  @ApiProperty({ description: 'Overall health status' })
  health: string;

  @ApiProperty({ description: 'Temperature sensors data' })
  temperature: any;

  @ApiProperty({ description: 'Fan status information' })
  fanStatus: any;

  @ApiProperty({ description: 'Power supply status' })
  powerSupplyStatus: any;

  @ApiProperty({ description: 'CPU usage percentage', required: false })
  cpuUsage?: number;

  @ApiProperty({ description: 'Memory usage in MB', required: false })
  memoryUsage?: number;

  @ApiProperty({ description: 'Last update timestamp' })
  lastUpdated: string;
}