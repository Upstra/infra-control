import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetSetupStatusUseCase } from '../use-cases';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly getSetupStatusUseCase: GetSetupStatusUseCase) {}

  @Get('status')
  @ApiOperation({ summary: 'Get application setup status' })
  async getSetupStatus(@Request() req) {
    const userId = req.user?.userId;
    return this.getSetupStatusUseCase.execute(userId);
  }

  @Get('status/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get setup status for authenticated user' })
  async getAuthenticatedSetupStatus(@Request() req) {
    return this.getSetupStatusUseCase.execute(req.user.userId);
  }
}
