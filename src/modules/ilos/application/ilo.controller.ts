import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { IloService } from './ilo.service';
import { IloResponseDto } from './dto/ilo.response.dto';
import { IloCreationDto } from './dto/ilo.creation.dto';

@Controller('ilo')
export class IloController {
  constructor(private readonly iloService: IloService) {}

  @Get()
  async getAllIlos(): Promise<IloResponseDto[]> {
    return this.iloService.getAllIlos();
  }

  @Get(':id')
  async getIloById(@Param('id') id: string): Promise<IloResponseDto> {
    return this.iloService.getIloById(id);
  }

  @Post()
  async createIlo(@Body() iloDto: IloCreationDto): Promise<IloResponseDto> {
    return this.iloService.createIlo(iloDto);
  }

  @Patch(':id')
  async updateIlo(
    @Param('id') id: string,
    @Body() iloDto: IloCreationDto,
  ): Promise<IloResponseDto> {
    return this.iloService.updateIlo(id, iloDto);
  }

  @Delete(':id')
  async deleteIlo(@Param('id') id: string): Promise<void> {
    return this.iloService.deleteIlo(id);
  }
}
