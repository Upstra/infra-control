import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmUpdateDto } from '../dto/vm.update.dto';
import { VmDomainService } from '../../domain/services/vm.domain.service';
import { VmResponseDto } from '../dto/vm.response.dto';

@Injectable()
export class UpdateVmUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
    private readonly domain: VmDomainService,
  ) {}

  async execute(id: string, dto: VmUpdateDto): Promise<VmResponseDto> {
    const existingVm = await this.repo.findVmById(id);
    const updatedEntity = this.domain.updateVmEntity(existingVm, dto);
    const savedVm = await this.repo.save(updatedEntity);
    return new VmResponseDto(savedVm);
  }
}
