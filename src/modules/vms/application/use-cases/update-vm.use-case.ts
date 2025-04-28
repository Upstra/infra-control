import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmUpdateDto } from '../dto/vm.update.dto';
import { VmDomainService } from '../../vm.domain.service';
import { VmResponseDto } from '../dto/vm.response.dto';
import {
  VmNotFoundException,
  VmUpdateException,
} from '../../domain/exceptions/vm.exception';

@Injectable()
export class UpdateVmUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
    private readonly domain: VmDomainService,
  ) {}

  async execute(id: string, dto: VmUpdateDto): Promise<VmResponseDto> {
    try {
      const existingVm = await this.repo.findVmById(id);
      if (!existingVm) throw new VmNotFoundException(id);

      const updatedEntity = this.domain.updateVmEntity(existingVm, dto);
      const savedVm = await this.repo.save(updatedEntity);
      return new VmResponseDto(savedVm);
    } catch (error) {
      if (error instanceof VmNotFoundException) {
        throw error;
      }
      throw new VmUpdateException();
    }
  }
}
