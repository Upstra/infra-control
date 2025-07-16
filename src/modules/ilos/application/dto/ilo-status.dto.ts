import { ApiProperty } from '@nestjs/swagger';
import { ServerMetricsDto } from './server-metrics.dto';

export enum IloServerStatus {
  ON = 'ON',
  OFF = 'OFF',
  ERROR = 'Error',
}

export class IloStatusResponseDto {
  @ApiProperty({ enum: IloServerStatus, description: 'Current server status' })
  status: IloServerStatus;

  @ApiProperty({ description: 'Server IP address' })
  ip: string;

  @ApiProperty({ description: 'Server ID' })
  serverId: string;

  @ApiProperty({ description: 'Server name' })
  serverName: string;

  @ApiProperty({ description: 'Server type (esxi, vcenter, etc.)' })
  serverType: string;

  @ApiProperty({ description: 'VMware host MOID' })
  vmwareHostMoid: string;

  @ApiProperty({ description: 'Server state from database' })
  serverState: string;

  @ApiProperty({ description: 'Server priority' })
  serverPriority: number;

  @ApiProperty({ description: 'UPS ID if assigned', required: false })
  upsId?: string;

  @ApiProperty({ description: 'Room ID' })
  roomId: string;

  @ApiProperty({ description: 'Group ID if assigned', required: false })
  groupId?: string;

  @ApiProperty({ description: 'iLO ID', required: false })
  iloId?: string;

  @ApiProperty({
    description: 'Power metrics from VMware',
    type: ServerMetricsDto,
  })
  metrics: ServerMetricsDto;
}

export class IloPowerResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiProperty({ description: 'Operation message' })
  message: string;

  @ApiProperty({
    enum: IloServerStatus,
    description: 'Current server status after operation',
  })
  currentStatus: IloServerStatus;
}
