import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { RoomCreationDto, RoomResponseDto, RoomListResponseDto } from '../dto';
import {
  CreateRoomUseCase,
  DeleteRoomUseCase,
  GetRoomListUseCase,
  GetAllRoomsUseCase,
  GetRoomByIdUseCase,
  UpdateRoomUseCase,
} from '../use-cases';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

@ApiTags('Room')
@Controller('room')
export class RoomController {
  constructor(
    private readonly getAllRoomsUseCase: GetAllRoomsUseCase,
    private readonly getRoomListUseCase: GetRoomListUseCase,
    private readonly getRoomByIdUseCase: GetRoomByIdUseCase,
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeCounts', required: false, type: Boolean })
  @ApiOperation({ summary: 'Lister les salles paginées' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: RoomListResponseDto })
  async getRooms(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('includeCounts') includeCounts = 'false',
  ): Promise<RoomListResponseDto> {
    const withCounts = includeCounts === 'true';
    return this.getRoomListUseCase.execute(
      Number(page),
      Number(limit),
      withCounts,
    );
  }

  @Get('all')
  @ApiOperation({ summary: 'Lister toutes les salles' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: [RoomResponseDto] })
  async getAllRooms(): Promise<RoomResponseDto[]> {
    return this.getAllRoomsUseCase.execute();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la salle à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer une salle par ID',
    description:
      'Retourne les informations d’une salle spécifique à partir de son UUID.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: RoomResponseDto })
  async getRoomById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() req: JwtPayload,
  ): Promise<RoomResponseDto> {
    return this.getRoomByIdUseCase.execute(id, req.userId);
  }

  @Post()
  @ApiBody({
    type: RoomCreationDto,
    description: 'Données nécessaires à la création d’une nouvelle salle',
    required: true,
  })
  @ApiOperation({
    summary: 'Créer une nouvelle salle',
    description:
      'Crée une salle dans le système à partir des données du `RoomCreationDto`.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, type: RoomResponseDto })
  async createRoom(
    @CurrentUser() user: JwtPayload,
    @Body() roomDto: RoomCreationDto,
  ): Promise<RoomResponseDto> {
    return this.createRoomUseCase.execute(roomDto, user.userId);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la salle à mettre à jour',
    required: true,
  })
  @ApiBody({
    type: RoomCreationDto,
    description: 'Données nécessaires à la mise à jour d’une salle existante',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour une salle',
    description:
      'Met à jour les informations d’une salle existante via son UUID.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: RoomResponseDto })
  async updateRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roomDto: RoomCreationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RoomResponseDto> {
    return this.updateRoomUseCase.execute(id, roomDto, user.userId);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de la salle à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer une salle',
    description: 'Supprime une salle du système de manière permanente.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 204, description: 'Salle supprimée avec succès' })
  async deleteRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.deleteRoomUseCase.execute(id, user.userId);
  }
}
