import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { register } from 'prom-client';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Monitoring')
@Controller('metrics')
export class PrometheusController {
  @Get()
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns Prometheus metrics in text format',
  })
  async getMetrics(@Res() response: Response): Promise<void> {
    const metrics = await register.metrics();
    response.set('Content-Type', register.contentType);
    response.send(metrics);
  }
}
