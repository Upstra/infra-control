import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmEndpointInterface } from '../interfaces/vm.endpoint.interface';
import { VmUpdateDto } from '../dto/vm.update.dto';
import { VmDomainService } from '../../vm.domain.service';

@Injectable()
export class VmService implements VmEndpointInterface {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
    private readonly vmDomain: VmDomainService,
  ) {}

  async getAllVms(): Promise<VmResponseDto[]> {
    const vms = await this.vmRepository.findAll();
    return vms.map((vm) => new VmResponseDto(vm));
  }

  async getVmById(id: string): Promise<VmResponseDto> {
    const vm = await this.vmRepository.findVmById(id);
    return new VmResponseDto(vm);
  }

  async createVm(vmDto: VmCreationDto): Promise<VmResponseDto> {
    const entity = this.vmDomain.createVmEntity(vmDto);
    const vm = await this.vmRepository.save(entity);

    return new VmResponseDto(vm);
  }

  async updateVm(id: string, vmDto: VmUpdateDto): Promise<VmResponseDto> {
    const vmExists = await this.vmRepository.findVmById(id);

    const entity = this.vmDomain.updateVmEntity(vmExists, vmDto);
    const vm = await this.vmRepository.save(entity);
    return new VmResponseDto(vm);
  }

  async deleteVm(id: string): Promise<void> {
    await this.vmRepository.deleteVm(id);
  }
}
