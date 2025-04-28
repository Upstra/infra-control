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
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import {
  CreateUpsUseCase,
  DeleteUpsUseCase,
  GetAllUpsUseCase,
  GetUpsByIdUseCase,
  UpdateUpsUseCase,
} from '@/modules/ups/application/use-cases';

import { UpsResponseDto } from '../dto/ups.response.dto';
import { UpsCreationDto } from '../dto/ups.creation.dto';
import { UpsUpdateDto } from '../dto/ups.update.dto';

@ApiTags('UPS')
@Controller('ups')
export class UpsController {
  constructor(
    private readonly getAllUpsUseCase: GetAllUpsUseCase,
    private readonly getUpsByIdUseCase: GetUpsByIdUseCase,
    private readonly createUpsUseCase: CreateUpsUseCase,
    private readonly updateUpsUseCase: UpdateUpsUseCase,
    private readonly deleteUpsUseCase: DeleteUpsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister tous les équipements UPS',
    description:
      'Renvoie la liste complète de tous les équipements UPS disponibles.',
  })
  async getAllUps(): Promise<UpsResponseDto[]> {
    return this.getAllUpsUseCase.execute();
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
    return this.getUpsByIdUseCase.execute(id);
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
    return this.createUpsUseCase.execute(upsDto);
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
    return this.updateUpsUseCase.execute(id, upsDto);
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
    return this.deleteUpsUseCase.execute(id);
  }
}
