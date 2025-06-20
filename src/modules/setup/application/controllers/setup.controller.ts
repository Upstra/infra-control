import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import {
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
  GetSetupProgressUseCase,
  GetSetupStatusUseCase,
} from '../use-cases';
import { CompleteVmDiscoveryDto } from '../dto/complete-vm-discovery.dto';
import { CompleteSetupStepDto } from '../dto';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(
    private readonly getSetupStatusUseCase: GetSetupStatusUseCase,
    private readonly completeVmDiscoveryUseCase: CompleteVmDiscoveryUseCase,
    private readonly completeStep: CompleteSetupStepUseCase,
    private readonly getProgress: GetSetupProgressUseCase,
  ) {}

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

  @Post('vm-discovery/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marquer la découverte des VMs comme complétée',
    description:
      "Appelé après que l'utilisateur ait scanné les VMs d'un serveur ESXi",
  })
  @ApiBody({ type: CompleteVmDiscoveryDto })
  async completeVmDiscovery(
    @Request() req,
    @Body() body: CompleteVmDiscoveryDto,
  ) {
    await this.completeVmDiscoveryUseCase.execute(req.user.userId, body);
    return this.getSetupStatusUseCase.execute(req.user.userId);
  }

  @Post('step/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: CompleteSetupStepDto })
  @ApiOperation({ summary: 'Marquer une étape du setup comme complétée' })
  async completeSetupStep(@Request() req, @Body() body: CompleteSetupStepDto) {
    return this.completeStep.execute(body.step, req.user.userId, body.metadata);
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer toute la progression du setup' })
  async getSetupProgress() {
    return this.getProgress.execute();
  }
}
