import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import {
  UseLoggingContext,
  LogToHistory,
} from '@/core/decorators/logging-context.decorator';
import {
  GetServerPrioritiesUseCase,
  GetVmPrioritiesUseCase,
  SwapServerPrioritiesUseCase,
  SwapVmPrioritiesUseCase,
} from '../use-cases';
import {
  ServerPriorityResponseDto,
  VmPriorityResponseDto,
  SwapServerPriorityDto,
  SwapVmPriorityDto,
  SwapServerResponseDto,
  SwapVmResponseDto,
} from '../dto';

@ApiTags('priorities')
@Controller('priorities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PriorityController {
  constructor(
    private readonly getServerPriorities: GetServerPrioritiesUseCase,
    private readonly getVmPriorities: GetVmPrioritiesUseCase,
    private readonly swapServerPriorities: SwapServerPrioritiesUseCase,
    private readonly swapVmPriorities: SwapVmPrioritiesUseCase,
  ) {}

  @Get('servers')
  @ApiOperation({
    summary: 'Get all servers with priorities',
    description: 'Returns servers filtered by user permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of servers with priorities',
    type: [ServerPriorityResponseDto],
  })
  @UseLoggingContext({
    entityType: 'server-priority',
    action: 'LIST',
  })
  async getServerPrioritiesList(
    @CurrentUser() user: JwtPayload,
  ): Promise<ServerPriorityResponseDto[]> {
    return this.getServerPriorities.execute(user.userId);
  }

  @Get('vms')
  @ApiOperation({
    summary: 'Get all VMs with priorities',
    description: 'Returns VMs filtered by user permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of VMs with priorities',
    type: [VmPriorityResponseDto],
  })
  @UseLoggingContext({
    entityType: 'vm-priority',
    action: 'LIST',
  })
  async getVmPrioritiesList(
    @CurrentUser() user: JwtPayload,
  ): Promise<VmPriorityResponseDto[]> {
    return this.getVmPriorities.execute(user.userId);
  }

  @Post('servers/swap')
  @ApiOperation({
    summary: 'Swap priorities between two servers',
    description: 'Atomically exchanges priority values between two servers',
  })
  @ApiResponse({
    status: 200,
    description: 'Priorities successfully swapped',
    type: SwapServerResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions on one or both servers',
  })
  @ApiResponse({
    status: 404,
    description: 'One or both servers not found',
  })
  @LogToHistory('server-priority', 'SWAP', {
    extractEntityId: (data) => `${data.server1.id}-${data.server2.id}`,
    extractMetadata: (data) => ({
      server1: {
        id: data.server1.id,
        name: data.server1.name,
        oldPriority: data.server1.priority,
      },
      server2: {
        id: data.server2.id,
        name: data.server2.name,
        oldPriority: data.server2.priority,
      },
      swapType: 'server_priority_swap',
    }),
  })
  async swapServerPrioritiesHandler(
    @Body() dto: SwapServerPriorityDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SwapServerResponseDto> {
    return this.swapServerPriorities.execute(
      dto.server1Id,
      dto.server2Id,
      user.userId,
    );
  }

  @Post('vms/swap')
  @ApiOperation({
    summary: 'Swap priorities between two VMs',
    description: 'Atomically exchanges priority values between two VMs',
  })
  @ApiResponse({
    status: 200,
    description: 'Priorities successfully swapped',
    type: SwapVmResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions on one or both VMs',
  })
  @ApiResponse({
    status: 404,
    description: 'One or both VMs not found',
  })
  @LogToHistory('vm-priority', 'SWAP', {
    extractEntityId: (data) => `${data.vm1.id}-${data.vm2.id}`,
    extractMetadata: (data) => ({
      vm1: {
        id: data.vm1.id,
        name: data.vm1.name,
        oldPriority: data.vm1.priority,
      },
      vm2: {
        id: data.vm2.id,
        name: data.vm2.name,
        oldPriority: data.vm2.priority,
      },
      swapType: 'vm_priority_swap',
    }),
  })
  async swapVmPrioritiesHandler(
    @Body() dto: SwapVmPriorityDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SwapVmResponseDto> {
    return this.swapVmPriorities.execute(dto.vm1Id, dto.vm2Id, user.userId);
  }
}
