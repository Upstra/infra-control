import { ApiProperty } from '@nestjs/swagger';
import { InfrastructureKpisDto } from './infrastructure-kpis.dto';

export class FullDashboardStatsDto extends InfrastructureKpisDto {
  @ApiProperty({ example: 100 })
  totalUsers: number;

  @ApiProperty({ example: 5 })
  adminUsers: number;

  @ApiProperty({ example: 10 })
  totalRooms: number;

  @ApiProperty({ example: 8 })
  totalUps: number;

  @ApiProperty({ example: 20 })
  totalServers: number;

  @ApiProperty({ example: 50 })
  totalVms: number;

  @ApiProperty({ example: 18 })
  serversUp: number;

  @ApiProperty({ example: 2 })
  serversDown: number;

  @ApiProperty({ example: 45 })
  vmsUp: number;

  @ApiProperty({ example: 5 })
  vmsDown: number;

  @ApiProperty({ example: true })
  setupComplete: boolean;

  @ApiProperty({ example: 80 })
  setupProgress: number;

  @ApiProperty({ example: 12 })
  onlineUsers: number;
}
