import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { RoomResponseDto } from '../dto/room.response.dto';
import { RoomEndpointInterface } from '../interfaces/room.endpoint.interface';
import { RoomCreationDto } from '../dto/room.creation.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Room')
@Controller('room')
export class RoomController implements RoomEndpointInterface {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les salles',
    description: 'Renvoie la liste de toutes les salles disponibles.',
  })
  async getAllRooms(): Promise<RoomResponseDto[]> {
    return this.roomService.getAllRooms();
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
  async getRoomById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RoomResponseDto> {
    return this.roomService.getRoomById(id);
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
  async createRoom(@Body() roomDto: RoomCreationDto): Promise<RoomResponseDto> {
    return this.roomService.createRoom(roomDto);
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
  async updateRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() roomDto: RoomCreationDto,
  ): Promise<RoomResponseDto> {
    return this.roomService.updateRoom(id, roomDto);
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
  async deleteRoom(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roomService.deleteRoom(id);
  }
}
