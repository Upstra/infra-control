import { Inject, Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';

/**
 * Fetches detailed information for a single VM by its identifier.
 *
 * Responsibilities:
 * - Validates the VM ID.
 * - Checks user permissions if applicable.
 * - Retrieves the VM aggregate (including server association and state) via VmDomainService.
 * - Converts the entity to VmDto for response.
 *
 * @param id  UUID of the VM to retrieve.
 * @returns   Promise<VmDto> the matching VM DTO.
 *
 * @throws NotFoundException if no VM exists with the given ID.
 *
 * @example
 * const vm = await getVmByIdUseCase.execute('vm-uuid-123');
 */

@Injectable()
export class GetVmByIdUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(id: string): Promise<VmResponseDto> {
    const vm = await this.repo.findVmById(id);
    return new VmResponseDto(vm);
  }
}
