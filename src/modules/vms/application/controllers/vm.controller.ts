import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { VmService } from '../services/vm.service';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmEndpointInterface } from '../interfaces/vm.endpoint.interface';
import { VmUpdateDto } from '../dto/vm.update.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('VM')
@Controller('vm')
export class VmController implements VmEndpointInterface {
  constructor(private readonly vmService: VmService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les machines virtuelles',
    description:
      'Renvoie toutes les machines virtuelles enregistrées dans le système.',
  })
  async getAllVms(): Promise<VmResponseDto[]> {
    return this.vmService.getAllVms();
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID ou identifiant unique de la VM à récupérer',
    required: true,
  })
  @ApiOperation({
    summary: 'Récupérer une VM par ID',
    description:
      'Retourne les informations détaillées d’une machine virtuelle en fonction de son identifiant.',
  })
  async getVmById(@Param('id') id: string): Promise<VmResponseDto> {
    return this.vmService.getVmById(id);
  }

  @Post()
  @ApiBody({
    type: VmCreationDto,
    description: 'Données nécessaires à la création d’une VM',
    required: true,
  })
  @ApiOperation({
    summary: 'Créer une nouvelle VM',
    description:
      'Crée une machine virtuelle en utilisant les données spécifiées dans le `VmCreationDto`.',
  })
  async createVm(@Body() vmDto: VmCreationDto): Promise<VmResponseDto> {
    return this.vmService.createVm(vmDto);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID ou identifiant unique de la VM à modifier',
    required: true,
  })
  @ApiBody({
    type: VmUpdateDto,
    description: 'Données de mise à jour de la machine virtuelle',
    required: true,
  })
  @ApiOperation({
    summary: 'Mettre à jour une VM',
    description:
      'Met à jour les informations d’une machine virtuelle existante.',
  })
  async updateVm(
    @Param('id') id: string,
    @Body() vmDto: VmUpdateDto,
  ): Promise<VmResponseDto> {
    return this.vmService.updateVm(id, vmDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID ou identifiant unique de la VM à supprimer',
    required: true,
  })
  @ApiOperation({
    summary: 'Supprimer une VM',
    description:
      'Supprime une machine virtuelle du système à partir de son identifiant. Action irréversible.',
  })
  async deleteVm(@Param('id') id: string): Promise<void> {
    return this.vmService.deleteVm(id);
  }
}
