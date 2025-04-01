import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from './dto/vm.response.dto';
import { VmCreationDto } from './dto/vm.creation.dto';

@Injectable()
export class VmService {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
  ) {}

  async getAllVms(): Promise<VmResponseDto[]> {
    return null;
  }

  async getVmById(id: string): Promise<VmResponseDto> {
    return null;
  }

  async createVm(vmDto: VmCreationDto): Promise<VmResponseDto> {
    return null;
  }

  async updateVm(id: string, vmDto: VmCreationDto): Promise<VmResponseDto> {
    return null;
  }

  async deleteVm(id: string): Promise<void> {
    return null;
  }
}
