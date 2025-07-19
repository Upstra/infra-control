import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class VmMetricsDto {
  @ApiProperty({ description: 'CPU usage percentage', example: 25.5 })
  @IsNumber()
  readonly cpuUsage: number;

  @ApiProperty({ description: 'Memory usage percentage', example: 60.2 })
  @IsNumber()
  readonly memoryUsage: number;

  @ApiProperty({ description: 'Total memory in MB', example: 4096 })
  @IsNumber()
  readonly memoryMB: number;

  @ApiProperty({ description: 'VMware power state', example: 'poweredOn' })
  @IsString()
  readonly powerState: string;

  @ApiProperty({ description: 'Guest tools status', example: 'toolsOk' })
  @IsOptional()
  @IsString()
  readonly guestToolsStatus?: string;
}
