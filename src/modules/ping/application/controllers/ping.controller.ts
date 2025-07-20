import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PingHostnameUseCase } from '../use-cases/ping-hostname.use-case';
import { PingResponseDto } from '../dto/ping-response.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';

@ApiTags('Ping')
@Controller('ping')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PingController {
  constructor(private readonly pingHostnameUseCase: PingHostnameUseCase) {}

  @Get('hostname/:hostname')
  @ApiOperation({
    summary: 'Ping a hostname or IP address',
    description:
      'Test connectivity to a hostname or IP address without persisting to database',
  })
  @ApiParam({
    name: 'hostname',
    description: 'IP address or hostname to ping',
    example: '192.168.1.100',
  })
  @ApiResponse({
    status: 200,
    description: 'Ping result',
    type: PingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid hostname or IP address format',
  })
  async pingHostname(
    @Param('hostname') hostname: string,
  ): Promise<PingResponseDto> {
    return this.pingHostnameUseCase.execute(hostname);
  }
}
