import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Ping a hostname or IP address' })
  @ApiParam({ name: 'hostname', example: '192.168.1.100' })
  @ApiResponse({ status: 200, type: PingResponseDto })
  async pingHostname(
    @Param('hostname') hostname: string,
  ): Promise<PingResponseDto> {
    return this.pingHostnameUseCase.execute(hostname);
  }

  @Get('check')
  @ApiOperation({ summary: 'Ping a host via query param (supporte les URLs HTTP)' })
  @ApiResponse({ status: 200, type: PingResponseDto })
  async pingCheck(@Query('host') host: string): Promise<PingResponseDto> {
    return this.pingHostnameUseCase.execute(host);
  }
}
