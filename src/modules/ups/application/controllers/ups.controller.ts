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
import { UpsService } from '../services/ups.service';
import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsCreationDto } from '../dto/ups.creation.dto';
import { UpsEndpointInterface } from '../interfaces/ups.endpoint.interface';
import { UpsUpdateDto } from '../dto/ups.update.dto';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('UPS')
@Controller('ups')
export class UpsController implements UpsEndpointInterface {
  constructor(private readonly upsService: UpsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister tous les équipements UPS',
    description:
      'Renvoie la liste complète de tous les équipements UPS disponibles.',
  })
  async getAllUps(): Promise<UpsResponseDto[]> {
    return this.upsService.getAllUps();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de l’équipement UPS à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer un équipement UPS par ID',
    description:
      'Renvoie les détails d’un équipement UPS à partir de son UUID.',
  })
  async getUpsById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UpsResponseDto> {
    return this.upsService.getUpsById(id);
  }

  @Post()
  @ApiBody({
    type: UpsCreationDto,
    description: 'Données nécessaires à la création d’un nouvel équipement UPS',
    required: true,
  })
  @ApiOperation({
    summary: 'Créer un nouvel équipement UPS',
    description:
      'Crée un nouvel UPS dans le système à partir des informations fournies.',
  })
  async createUps(@Body() upsDto: UpsCreationDto): Promise<UpsResponseDto> {
    return this.upsService.createUps(upsDto);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de l’équipement UPS à mettre à jour',
    required: true,
  })
  @ApiBody({
    type: UpsUpdateDto,
    description: 'Données à jour pour l’équipement UPS',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour un équipement UPS',
    description:
      'Met à jour les informations d’un UPS existant à partir de son UUID.',
  })
  async updateUps(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() upsDto: UpsUpdateDto,
  ): Promise<UpsResponseDto> {
    return this.upsService.updateUps(id, upsDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID de l’équipement UPS à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer un équipement UPS',
    description:
      'Supprime un UPS du système en utilisant son UUID. Action définitive.',
  })
  async deleteUps(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.upsService.deleteUps(id);
  }
}
