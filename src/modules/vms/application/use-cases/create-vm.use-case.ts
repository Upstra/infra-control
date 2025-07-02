import { Inject, Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmDomainService } from '../../domain/services/vm.domain.service';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmResponseDto } from '../dto/vm.response.dto';

/**
 * Creates a new virtual machine under a specified server.
 *
 * Responsibilities:
 * - Validates CreateVmDto fields (name, serverId, resources).
 * - Delegates to VmDomainService to instantiate and provision the VM.
 * - Persists the VM entity and returns its DTO.
 *
 * @param dto  CreateVmDto containing VM attributes and parent server.
 * @returns    Promise<VmDto> the newly created VM DTO.
 *
 * @throws ValidationException if input data is invalid.
 *
 * @example
 * const newVm = await createVmUseCase.execute({ name:'vm1', serverId:'srv-uuid', cpu:2, ram:4096 });
 */

@Injectable()
export class CreateVmUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
    private readonly domain: VmDomainService,
  ) {}

  async execute(dto: VmCreationDto): Promise<VmResponseDto> {
    const entity = this.domain.createVmEntity(dto);
    const vm = await this.repo.save(entity);
    return new VmResponseDto(vm);
  }
}
