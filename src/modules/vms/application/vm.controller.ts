import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { VmService } from './vm.service';
import { VmCreationDto } from './dto/vm.creation.dto';
import { VmResponseDto } from './dto/vm.response.dto';

@Controller('vm')
export class VmController {
  constructor(private readonly vmService: VmService) {}

  @Get()
  async getAllVms(): Promise<VmResponseDto[]> {
    return this.vmService.getAllVms();
  }

  @Get(':id')
  async getVmById(@Param('id') id: string): Promise<VmResponseDto> {
    return this.vmService.getVmById(id);
  }

  @Post()
  async createVm(@Body() vmDto: VmCreationDto): Promise<VmResponseDto> {
    return this.vmService.createVm(vmDto);
  }

  @Patch(':id')
  async updateVm(
    @Param('id') id: string,
    @Body() vmDto: VmCreationDto,
  ): Promise<VmResponseDto> {
    return this.vmService.updateVm(id, vmDto);
  }

  @Delete(':id')
  async deleteVm(@Param('id') id: string): Promise<void> {
    return this.vmService.deleteVm(id);
  }
}
