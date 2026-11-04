import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { GetHardwareEnvironmentUseCase } from '../use-cases/get-hardware-environment.use-case';
import { RoomEnvironmentResponseDto } from '../dto/room-environment.response.dto';

@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('room')
export class RoomEnvironmentController {
  constructor(
    private readonly getHardwareEnvironmentUseCase: GetHardwareEnvironmentUseCase,
  ) {}

  @Get(':id/environment')
  @ApiOperation({
    summary: 'Hottest inlet temperature and total power draw of a room',
  })
  @ApiResponse({ status: 200, type: RoomEnvironmentResponseDto })
  @ApiResponse({ status: 404, description: 'Room not found' })
  getEnvironment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomEnvironmentResponseDto> {
    return this.getHardwareEnvironmentUseCase.forRoom(id);
  }
}
