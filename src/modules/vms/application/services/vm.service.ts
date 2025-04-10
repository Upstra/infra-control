import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmEndpointInterface } from '../interfaces/vm.endpoint.interface';
import { VmNotFoundException } from '../../domain/exceptions/vm.notfound.exception';
import { VmUpdateDto } from '../dto/vm.update.dto';
import { VmDomainService } from '../../vm.domain.service';

@Injectable()
export class VmService implements VmEndpointInterface {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
    private readonly vmDomain: VmDomainService,
  ) { }

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

      const entity = this.vmDomain.createVmEntity(vmDto);
      const vm = await this.vmRepository.save(entity);

      return new VmResponseDto(vm);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  async updateVm(id: string, vmDto: VmUpdateDto): Promise<VmResponseDto> {
    try {
      const vmExists = await this.vmRepository.findVmById(id);

      const entity = this.vmDomain.updateVmEntity(
        vmExists,
        vmDto);
      const vm = await this.vmRepository.save(entity);
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
