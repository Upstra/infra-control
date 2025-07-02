import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../dto/vm.response.dto';

/**
 * Retrieves the full list of virtual machines in the system.
 *
 * Responsibilities:
 * - Delegates to VmDomainService to load all VM aggregates.
 * - Maps each VM entity to VmDto for client consumption.
 *
 * @returns Promise<VmDto[]> array of VM DTOs.
 *
 * @remarks
 * Read-only; used by controllers to display VM overview screens.
 *
 * @example
 * const vms = await getAllVmsUseCase.execute();
 */

@Injectable()
export class GetAllVmsUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
  ) {}

  async execute(): Promise<VmResponseDto[]> {
    const vms = await this.repo.findAll();
    return vms.map((vm) => new VmResponseDto(vm));
  }
}
