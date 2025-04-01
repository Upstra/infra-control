import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UpsService } from './ups.service';
import { UpsResponseDto } from './dto/ups.response.dto';
import { UpsCreationDto } from './dto/ups.creation.dto';

@Controller('ups')
export class UpsController {
  constructor(private readonly upsService: UpsService) {}

  @Get()
  async getAllUps(): Promise<UpsResponseDto> {
    return this.upsService.getAllUps();
  }

  @Get(':id')
  async getUpsById(@Param('id') id: string): Promise<UpsResponseDto> {
    return this.upsService.getUpsById(id);
  }

  @Post()
  async createUps(@Body() upsDto: UpsCreationDto): Promise<UpsResponseDto> {
    return this.upsService.createUps(upsDto);
  }

  @Patch(':id')
  async updateUps(
    @Param('id') id: string,
    @Body() upsDto: UpsCreationDto,
  ): Promise<UpsResponseDto> {
    return this.upsService.updateUps(id, upsDto);
  }

  @Delete(':id')
  async deleteUps(@Param('id') id: string): Promise<void> {
    return this.upsService.deleteUps(id);
  }
}
