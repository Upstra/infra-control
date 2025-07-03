import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetHealthStatusUseCase } from '../use-cases/get-health-status.use-case';
import { HealthResponseDto } from '../dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly getHealthStatusUseCase: GetHealthStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Comprehensive health check endpoint',
    description:
      'Returns detailed health status of all system components including database, Redis, memory, and external services',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service degraded or unhealthy',
    type: HealthResponseDto,
  })
  async check(): Promise<HealthResponseDto> {
    return await this.getHealthStatusUseCase.execute();
  }

  @Get('simple')
  @ApiOperation({
    summary: 'Simple health check endpoint',
    description: 'Returns basic status for quick availability checks',
  })
  @ApiResponse({ status: 200, description: 'Service operational' })
  simpleCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
