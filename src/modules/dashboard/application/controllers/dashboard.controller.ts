import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '@/modules/dashboard/domain/services/dashboard.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardStatsDto } from '../dto/dashboardStats.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtenir les statistiques générales du système',
    description: `Retourne une vue d'ensemble du système :
    - Nombre de serveurs
    - Nombre d’UPS
    - Nombre d’UPS critiques`,
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats();
  }
}
