import { ApiProperty } from '@nestjs/swagger';
import { ServerResponseDto } from '@/modules/servers/application/dto/server.response.dto';

export class DashboardStatsDto {
  @ApiProperty({ example: 12, description: 'Nombre total de serveurs' })
  totalServers: number;

  @ApiProperty({ example: 5, description: 'Nombre total d’UPS' })
  totalUps: number;

  @ApiProperty({ example: 2, description: 'Nombre d’UPS critiques' })
  criticalUpsCount: number;
}
