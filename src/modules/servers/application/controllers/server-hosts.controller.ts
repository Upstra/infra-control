import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetHostsMetricsUseCase } from '@/modules/vmware/application/use-cases/get-hosts-metrics.use-case';
import { HostMetricsResponseDto } from '@/modules/vmware/application/dto/host-metrics.response.dto';

@ApiTags('Server')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('server')
export class ServerHostsController {
  constructor(
    private readonly getHostsMetricsUseCase: GetHostsMetricsUseCase,
  ) {}

  @Get('hosts/metrics')
  @ApiOperation({
    summary: 'ESXi hosts health, CPU and memory from the telemetry cache',
  })
  @ApiResponse({ status: 200, type: [HostMetricsResponseDto] })
  getHostsMetrics(): Promise<HostMetricsResponseDto[]> {
    return this.getHostsMetricsUseCase.execute();
  }
}
