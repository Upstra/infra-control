import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { SensitiveOperationsGuard } from '@/core/guards/sensitive-operations.guard';
import { ApiUsageGuard } from '@/core/guards/api-usage.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { RequireRole } from '@/core/decorators/role.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import {
  CompleteSetupStepUseCase,
  CompleteVmDiscoveryUseCase,
  GetSetupProgressUseCase,
  GetSetupStatusUseCase,
  BulkCreateUseCase,
  BulkCreateWithDiscoveryUseCase,
  BulkValidationUseCase,
  GetTemplatesUseCase,
  CreateTemplateUseCase,
  GetSetupProgressEnhancedUseCase,
  ValidateIpUseCase,
  ValidateNameUseCase,
} from '../use-cases';
import { CompleteVmDiscoveryDto } from '../dto/complete-vm-discovery.dto';
import {
  CompleteSetupStepDto,
  SetupProgressDto,
  SetupStatusDto,
  BulkCreateRequestDto,
  BulkCreateResponseDto,
  ValidationRequestDto,
  ValidationResponseDto,
  TemplateListResponseDto,
  CreateTemplateRequestDto,
  TemplateResponseDto,
  SetupProgressEnhancedDto,
  IpValidationResponseDto,
  NameValidationResponseDto,
  BulkCreateWithDiscoveryRequestDto,
  BulkCreateWithDiscoveryResponseDto,
} from '../dto';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(
    private readonly getSetupStatusUseCase: GetSetupStatusUseCase,
    private readonly completeVmDiscoveryUseCase: CompleteVmDiscoveryUseCase,
    private readonly completeStep: CompleteSetupStepUseCase,
    private readonly getProgress: GetSetupProgressUseCase,
    private readonly bulkCreateUseCase: BulkCreateUseCase,
    private readonly bulkCreateWithDiscoveryUseCase: BulkCreateWithDiscoveryUseCase,
    private readonly bulkValidationUseCase: BulkValidationUseCase,
    private readonly getTemplatesUseCase: GetTemplatesUseCase,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly getSetupProgressEnhancedUseCase: GetSetupProgressEnhancedUseCase,
    private readonly validateIpUseCase: ValidateIpUseCase,
    private readonly validateNameUseCase: ValidateNameUseCase,
  ) {}

  @Get('status')
  @UseGuards(ApiUsageGuard)
  @ApiOperation({ summary: 'Get application setup status' })
  @ApiResponse({
    status: 200,
    description: "Statut actuel de l'installation",
    type: SetupStatusDto,
  })
  async getSetupStatus(@Request() req) {
    const userId = req.user?.userId;
    return this.getSetupStatusUseCase.execute(userId);
  }

  @Get('status/authenticated')
  @UseGuards(ApiUsageGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get setup status for authenticated user' })
  @ApiResponse({
    status: 200,
    description: "Statut du setup pour l'utilisateur authentifié",
    type: SetupStatusDto,
  })
  async getAuthenticatedSetupStatus(@Request() req) {
    return this.getSetupStatusUseCase.execute(req.user.userId);
  }

  @Post('vm-discovery/complete')
  @UseGuards(SensitiveOperationsGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marquer la découverte des VMs comme complétée',
    description:
      "Appelé après que l'utilisateur ait scanné les VMs d'un serveur ESXi",
  })
  @ApiBody({ type: CompleteVmDiscoveryDto })
  @ApiResponse({
    status: 200,
    description: 'Découverte des VMs terminée',
    type: SetupStatusDto,
  })
  async completeVmDiscovery(
    @Request() req,
    @Body() body: CompleteVmDiscoveryDto,
  ) {
    await this.completeVmDiscoveryUseCase.execute(req.user.userId, body);
    return this.getSetupStatusUseCase.execute(req.user.userId);
  }

  @Post('step/complete')
  @UseGuards(SensitiveOperationsGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiBody({ type: CompleteSetupStepDto })
  @ApiOperation({ summary: 'Marquer une étape du setup comme complétée' })
  @ApiResponse({
    status: 200,
    description: 'Étape de setup complétée',
    type: SetupProgressDto,
  })
  async completeSetupStep(@Request() req, @Body() body: CompleteSetupStepDto) {
    return this.completeStep.execute(body.step, req.user.userId, body.metadata);
  }

  @Get('progress')
  @UseGuards(ApiUsageGuard, JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer toute la progression du setup' })
  @ApiResponse({
    status: 200,
    description: 'Progression détaillée du setup',
    type: [SetupProgressDto],
  })
  async getSetupProgress() {
    return this.getProgress.execute();
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create multiple resources in bulk',
    description: 'Create rooms, UPS, and servers in a single transaction',
  })
  @ApiBody({ type: BulkCreateRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Resources created successfully',
    type: BulkCreateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or transaction failed',
  })
  async bulkCreate(
    @Body() dto: BulkCreateRequestDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<BulkCreateResponseDto> {
    return this.bulkCreateUseCase.execute(dto, currentUser.userId);
  }

  @Post('bulk-create-with-discovery')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create resources with automatic VMware discovery',
    description:
      'Create rooms, UPS, and servers in a single transaction, then automatically discover VMs from VMware servers',
  })
  @ApiBody({ type: BulkCreateWithDiscoveryRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Resources created and discovery initiated',
    type: BulkCreateWithDiscoveryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or transaction failed',
  })
  async bulkCreateWithDiscovery(
    @Body() dto: BulkCreateWithDiscoveryRequestDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<BulkCreateWithDiscoveryResponseDto> {
    const {
      enableDiscovery = true,
      discoverySessionId,
      ...bulkCreateData
    } = dto;
    return this.bulkCreateWithDiscoveryUseCase.execute(
      {
        ...bulkCreateData,
        enableDiscovery,
        discoverySessionId,
      },
      currentUser.userId,
    );
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate resources before creation',
    description: 'Validate configuration and optionally test connectivity',
  })
  @ApiBody({ type: ValidationRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Validation results',
    type: ValidationResponseDto,
  })
  async validateResources(
    @Body() dto: ValidationRequestDto,
  ): Promise<ValidationResponseDto> {
    return this.bulkValidationUseCase.execute(dto);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get available setup templates',
    description: 'Retrieve predefined and custom setup templates',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available templates',
    type: TemplateListResponseDto,
  })
  async getTemplates(): Promise<TemplateListResponseDto> {
    return this.getTemplatesUseCase.execute();
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @RequireRole({ isAdmin: true })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a custom template',
    description: 'Save current configuration as a reusable template',
  })
  @ApiBody({ type: CreateTemplateRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: TemplateResponseDto,
  })
  async createTemplate(
    @Body() dto: CreateTemplateRequestDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<TemplateResponseDto> {
    return this.createTemplateUseCase.execute(dto, currentUser);
  }

  @Get('progress/enhanced')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get enhanced setup progress',
    description: 'Get detailed progress information including resource counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Enhanced setup progress',
    type: SetupProgressEnhancedDto,
  })
  async getEnhancedProgress(): Promise<SetupProgressEnhancedDto> {
    return this.getSetupProgressEnhancedUseCase.execute();
  }

  @Get('validate/ip')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate IP address availability',
    description: 'Check if an IP address is available for use in setup',
  })
  @ApiQuery({
    name: 'value',
    description: 'IP address to validate',
    example: '192.168.1.100',
  })
  @ApiQuery({
    name: 'type',
    description: 'Resource type',
    enum: ['server', 'ups', 'ilo'],
  })
  @ApiQuery({
    name: 'excludeId',
    description: 'Resource ID to exclude from validation (for updates)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'IP validation result',
    type: IpValidationResponseDto,
  })
  async validateIp(
    @Query('value') value: string,
    @Query('type') type: 'server' | 'ups' | 'ilo',
    @Query('excludeId') excludeId?: string,
  ): Promise<IpValidationResponseDto> {
    return this.validateIpUseCase.execute({
      ip: value,
      resourceType: type,
      excludeId,
    });
  }

  @Get('validate/name')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate resource name availability',
    description: 'Check if a resource name is available for use in setup',
  })
  @ApiQuery({
    name: 'value',
    description: 'Resource name to validate',
    example: 'UPS-Primary',
  })
  @ApiQuery({
    name: 'type',
    description: 'Resource type',
    enum: ['room', 'ups', 'server'],
  })
  @ApiQuery({
    name: 'excludeId',
    description: 'Resource ID to exclude from validation (for updates)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Name validation result',
    type: NameValidationResponseDto,
  })
  async validateName(
    @Query('value') value: string,
    @Query('type') type: 'room' | 'ups' | 'server',
    @Query('excludeId') excludeId?: string,
  ): Promise<NameValidationResponseDto> {
    return this.validateNameUseCase.execute({
      name: value,
      resourceType: type,
      excludeId,
    });
  }
}
