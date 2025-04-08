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
import { UpsEndpointInterface } from '@/modules/ups/application/interfaces/ups.endpoint.interface';
import { UpsUpdateDto } from '@/modules/ups/application/dto/ups.update.dto';

@Controller('ups')
export class UpsController implements UpsEndpointInterface {
  constructor(private readonly upsService: UpsService) {}

  @Get()
  async getAllUps(): Promise<UpsResponseDto[]> {
    return this.upsService.getAllUps();
  }

  @Get(':id')
  async getUpsById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UpsResponseDto> {
    return this.upsService.getUpsById(id);
  }

  @Post()
  async createUps(@Body() upsDto: UpsCreationDto): Promise<UpsResponseDto> {
    return this.upsService.createUps(upsDto);
  }

  @Patch(':id')
  async updateUps(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() upsDto: UpsUpdateDto,
  ): Promise<UpsResponseDto> {
    return this.upsService.updateUps(id, upsDto);
  }

  @Delete(':id')
  async deleteUps(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.upsService.deleteUps(id);
  }
}
