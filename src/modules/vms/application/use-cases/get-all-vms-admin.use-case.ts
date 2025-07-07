import { Inject, Injectable } from '@nestjs/common';
import { VmResponseDto } from '../dto/vm.response.dto';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';

/**
 * Retrieves all VMs in the system for admin users.
 *
 * Responsibilities:
 * - No permission filtering - returns all VMs.
 * - Maps each VM entity to VmResponseDto for API consumption.
 * - Intended for admin-only access.
 *
 * @returns Promise<VmResponseDto[]> array of all VM DTOs.
 *
 * @remarks
 * Used by admin controllers to display complete VM listings without restrictions.
 * Access to this use case should be protected by admin role guard.
 *
 * @example
 * const allVms = await getAllVmsAdminUseCase.execute();
 */
@Injectable()
export class GetAllVmsAdminUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
  ) {}

  async execute(): Promise<VmResponseDto[]> {
    const vms = await this.vmRepository.findAll();
    return vms.map((vm) => new VmResponseDto(vm));
  }
}
