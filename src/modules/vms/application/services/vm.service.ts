import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmEndpointInterface } from '@/modules/vms/application/interfaces/vm.endpoint.interface';
import { VmNotFoundException } from '@/modules/vms/domain/exceptions/vm.notfound.exception';
import { VmUpdateDto } from '@/modules/vms/application/dto/vm.update.dto';

@Injectable()
export class VmService implements VmEndpointInterface {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
  ) {}

  async getAllVms(): Promise<VmResponseDto[]> {
    try {
      const vms = await this.vmRepository.findAll();
      return vms.map((vm) => new VmResponseDto(vm));
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async getVmById(id: string): Promise<VmResponseDto> {
    try {
      const vm = await this.vmRepository.findVmById(id);
      return new VmResponseDto(vm);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async createVm(vmDto: VmCreationDto): Promise<VmResponseDto> {
    try {
      const vm = await this.vmRepository.createVm(
        vmDto.name,
        vmDto.state,
        vmDto.grace_period_on,
        vmDto.grace_period_off,
        vmDto.os,
        vmDto.adminUrl,
        vmDto.ip,
        vmDto.login,
        vmDto.password,
        vmDto.priority,
        vmDto.serverId,
        vmDto.groupId,
      );
      return new VmResponseDto(vm);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateVm(id: string, vmDto: VmUpdateDto): Promise<VmResponseDto> {
    try {
      const vm = await this.vmRepository.updateVm(
        id,
        vmDto.name,
        vmDto.state,
        vmDto.grace_period_on,
        vmDto.grace_period_off,
        vmDto.os,
        vmDto.adminUrl,
        vmDto.ip,
        vmDto.login,
        vmDto.password,
        vmDto.priority,
        vmDto.serverId,
        vmDto.groupId,
      );
      return new VmResponseDto(vm);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async deleteVm(id: string): Promise<void> {
    try {
      await this.vmRepository.deleteVm(id);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private handleError(error: any): void {
    if (error instanceof VmNotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(
        'An error occurred while processing the request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
