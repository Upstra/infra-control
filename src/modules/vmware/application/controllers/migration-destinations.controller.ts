import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';
import { RequireRole } from '@/core/decorators/role.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import {
  UseLoggingContext,
  LogToHistory,
} from '@/core/decorators/logging-context.decorator';
import { GenerateMigrationPlanWithDestinationUseCase } from '../use-cases/generate-migration-plan-with-destination.use-case';
import { GetMigrationDestinationsUseCase } from '../use-cases/get-migration-destinations.use-case';
import { RemoveMigrationDestinationUseCase } from '../use-cases/remove-migration-destination.use-case';
import {
  SetMigrationDestinationsDto,
  MigrationDestinationsResponseDto,
  SetDestinationsResponseDto,
  RemoveDestinationResponseDto,
} from '../dto/migration-destination.dto';

@ApiTags('vmware-migration-destinations')
@Controller('vmware/servers/migration/destinations')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
@RequireRole({ isAdmin: true })
export class MigrationDestinationsController {
  constructor(
    private readonly generateMigrationPlanWithDestination: GenerateMigrationPlanWithDestinationUseCase,
    private readonly getMigrationDestinations: GetMigrationDestinationsUseCase,
    private readonly removeMigrationDestinationUseCase: RemoveMigrationDestinationUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get current migration destinations (Admin only)',
    description: 'Returns all configured migration destinations from the current YAML file.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of migration destinations',
    type: MigrationDestinationsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @UseLoggingContext({
    entityType: 'migration-destination',
    action: 'LIST',
  })
  async getMigrationDestinationsList(
    @CurrentUser() user: JwtPayload,
  ): Promise<MigrationDestinationsResponseDto> {
    return this.getMigrationDestinations.execute();
  }

  @Post()
  @ApiOperation({
    summary: 'Configure migration destinations (Admin only)',
    description: 'Configure migration destinations for servers and generate the YAML file.',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration destinations configured successfully',
    type: SetDestinationsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid destinations configuration',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @LogToHistory('migration-destination', 'SET', {
    extractEntityId: (data) => 'destinations',
    extractMetadata: (data) => ({
      destinationsCount: data.destinations.length,
      destinations: data.destinations,
    }),
  })
  async setMigrationDestinations(
    @Body() dto: SetMigrationDestinationsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SetDestinationsResponseDto> {
    await this.generateMigrationPlanWithDestination.execute(dto.destinations);
    
    return {
      message: 'Migration destinations configured successfully',
      yamlPath: '/home/upstra/ups_manager/plans/migration.yml',
    };
  }

  @Delete(':sourceServerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove migration destination (Admin only)',
    description: 'Remove the migration destination for a specific source server.',
  })
  @ApiParam({
    name: 'sourceServerId',
    description: 'ID of the source server',
    example: 'server-uuid-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Migration destination removed successfully',
    type: RemoveDestinationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Source server not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @LogToHistory('migration-destination', 'REMOVE', {
    extractEntityId: (data) => data.sourceServerId,
    extractMetadata: (data) => ({
      sourceServerId: data.sourceServerId,
    }),
  })
  async removeMigrationDestination(
    @Param('sourceServerId') sourceServerId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<RemoveDestinationResponseDto> {
    await this.removeMigrationDestinationUseCase.execute(sourceServerId);
    
    return {
      message: 'Migration destination removed successfully',
      sourceServerId,
    };
  }
}