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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';

import {
  CreateUpsUseCase,
  DeleteUpsUseCase,
  GetUpsListUseCase,
  GetAllUpsUseCase,
  GetUpsByIdUseCase,
  UpdateUpsUseCase,
} from '@/modules/ups/application/use-cases';

import {
  UpsCreationDto,
  UpsListResponseDto,
  UpsUpdateDto,
  UpsResponseDto,
} from '../dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { CurrentUser } from '@/core/decorators/current-user.decorator';

@ApiTags('UPS')
@Controller('ups')
export class UpsController {
  constructor(
    private readonly getAllUpsUseCase: GetAllUpsUseCase,
    private readonly getUpsListUseCase: GetUpsListUseCase,
    private readonly getUpsByIdUseCase: GetUpsByIdUseCase,
    private readonly createUpsUseCase: CreateUpsUseCase,
    private readonly updateUpsUseCase: UpdateUpsUseCase,
    private readonly deleteUpsUseCase: DeleteUpsUseCase,
  ) {}

  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOperation({ summary: 'Lister les UPS paginés' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UpsListResponseDto })
  async getUps(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<UpsListResponseDto> {
    return this.getUpsListUseCase.execute(Number(page), Number(limit));
  }

  @Get('all')
  @ApiOperation({ summary: 'Lister tous les équipements UPS' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: [UpsResponseDto] })
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UpsResponseDto })
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, type: UpsResponseDto })
  async createUps(
    @Body() upsDto: UpsCreationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpsResponseDto> {
    return this.createUpsUseCase.execute(upsDto, user.userId);
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, type: UpsResponseDto })
  async updateUps(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() upsDto: UpsUpdateDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpsResponseDto> {
    return this.updateUpsUseCase.execute(id, upsDto, user.userId);
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 204, description: 'UPS supprimé avec succès' })
  async deleteUps(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.deleteUpsUseCase.execute(id, user.userId);
  }
}
