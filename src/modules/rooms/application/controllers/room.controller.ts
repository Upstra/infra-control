import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { RoomCreationDto, RoomResponseDto } from '../dto';
import { ExpressRequestWithUser } from '@/core/types/express-with-user.interface';
import {
  CreateRoomUseCase,
  DeleteRoomUseCase,
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
    private readonly getRoomByIdUseCase: GetRoomByIdUseCase,
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly deleteRoomUseCase: DeleteRoomUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les salles',
    description: 'Renvoie la liste de toutes les salles disponibles.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  async deleteRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.deleteRoomUseCase.execute(id, user.userId);
  }
}
