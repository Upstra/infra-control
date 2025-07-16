import { ApiProperty } from '@nestjs/swagger';
import { VmwareServer } from '../../domain/interfaces';

export class VmwareServerDto {
  @ApiProperty({ description: 'Server name' })
  name: string;

  @ApiProperty({ description: 'vCenter IP address' })
  vCenterIp: string;

  @ApiProperty({ description: 'Cluster name' })
  cluster: string;

  @ApiProperty({ description: 'Server vendor' })
  vendor: string;

  @ApiProperty({ description: 'Server model' })
  model: string;

  @ApiProperty({ description: 'Server IP address' })
  ip: string;

  @ApiProperty({ description: 'Number of CPU cores' })
  cpuCores: number;

  @ApiProperty({ description: 'Number of CPU threads' })
  cpuThreads: number;

  @ApiProperty({ description: 'CPU frequency in MHz' })
  cpuMHz: number;

  @ApiProperty({ description: 'Total RAM in GB' })
  ramTotal: number;
}

export class ListServersResponseDto {
  @ApiProperty({
    description: 'List of ESXi servers',
    type: [VmwareServerDto],
  })
  servers: VmwareServer[];
}