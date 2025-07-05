import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { ExpressRequestWithUser } from '@/core/types/express-with-user.interface';
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
  async getServerPrioritiesList(
    @Req() req: ExpressRequestWithUser,
  ): Promise<ServerPriorityResponseDto[]> {
    return this.getServerPriorities.execute(req.user?.userId);
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
  async getVmPrioritiesList(
    @Req() req: ExpressRequestWithUser,
  ): Promise<VmPriorityResponseDto[]> {
    return this.getVmPriorities.execute(req.user?.userId);
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
  async swapServerPrioritiesHandler(
    @Body() dto: SwapServerPriorityDto,
    @Req() req: ExpressRequestWithUser,
  ): Promise<SwapServerResponseDto> {
    return this.swapServerPriorities.execute(
      dto.server1Id,
      dto.server2Id,
      req.user?.userId,
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
  async swapVmPrioritiesHandler(
    @Body() dto: SwapVmPriorityDto,
    @Req() req: ExpressRequestWithUser,
  ): Promise<SwapVmResponseDto> {
    return this.swapVmPriorities.execute(
      dto.vm1Id,
      dto.vm2Id,
      req.user?.userId,
    );
  }
}
