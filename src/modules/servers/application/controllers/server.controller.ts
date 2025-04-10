import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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
import { ServerService } from '../services/server.service';
import { ServerResponseDto } from '../dto/server.response.dto';
import { ServerCreationDto } from '../dto/server.creation.dto';
import { ServerEndpointInterface } from '../interfaces/server.endpoint.interface';
import { ServerUpdateDto } from '../dto/server.update.dto';

@ApiTags('Server')
@Controller('server')
export class ServerController implements ServerEndpointInterface {
  constructor(private readonly serverService: ServerService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister tous les serveurs',
    description:
      'Renvoie la liste de tous les serveurs enregistrés dans le système.',
  })
  async getAllServers(): Promise<ServerResponseDto[]> {
    return this.serverService.getAllServers();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer un serveur par ID',
    description:
      'Renvoie les informations d’un serveur spécifique via son UUID.',
  })
  async getServerById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServerResponseDto> {
    return this.serverService.getServerById(id);
  }

  @Post()
  @ApiBody({
    type: ServerCreationDto,
    description: 'Données nécessaires pour créer un nouveau serveur',
    required: true,
  })
  @ApiOperation({
    summary: 'Créer un nouveau serveur',
    description:
      'Crée un serveur avec les données spécifiées dans le `ServerCreationDto`.',
  })
  async createServer(
    @Body() serverDto: ServerCreationDto,
  ): Promise<ServerResponseDto> {
    return this.serverService.createServer(serverDto);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à mettre à jour',
    required: true,
  })
  @ApiBody({
    type: ServerUpdateDto,
    description: 'Données nécessaires pour mettre à jour un serveur',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour un serveur',
    description:
      'Met à jour les informations d’un serveur existant via son UUID.',
  })
  async updateServer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() serverDto: ServerUpdateDto,
  ): Promise<ServerResponseDto> {
    return this.serverService.updateServer(id, serverDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID du serveur à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer un serveur',
    description:
      'Supprime un serveur du système à partir de son UUID. Action irréversible.',
  })
  async deleteServer(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.serverService.deleteServer(id);
  }
}
