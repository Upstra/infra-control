import { Injectable, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmUpdateDto } from '../dto/vm.update.dto';
import { VmDomainService } from '../../domain/services/vm.domain.service';
import { VmResponseDto } from '../dto/vm.response.dto';
import { GroupRepository } from '@/modules/groups/infrastructure/repositories/group.repository';
import { GroupTypeMismatchException } from '@/modules/groups/domain/exceptions/group-type-mismatch.exception';
import { GroupType } from '@/modules/groups/domain/enums/group-type.enum';

/**
 * Updates configuration or state of an existing VM.
 *
 * Responsibilities:
 * - Validates VM ID and input DTO (resources, power actions).
 * - Fetches the current VM aggregate via VmDomainService.
 * - Applies changes (e.g., resizing, start/stop) and persists updates.
 * - Returns the updated VmDto.
 *
 * @param id   UUID of the VM to update.
 * @param dto  UpdateVmDto with fields to modify.
 * @returns    Promise<VmDto> the updated VM DTO.
 *
 * @throws NotFoundException if the VM does not exist.
 * @throws ValidationException if input data is invalid.
 *
 * @example
 * const updated = await updateVmUseCase.execute('vm-uuid', { ram:8192 });
 */

@Injectable()
export class UpdateVmUseCase {
  constructor(
    @Inject('VmRepositoryInterface')
    private readonly repo: VmRepositoryInterface,
    private readonly domain: VmDomainService,
    private readonly groupRepository: GroupRepository,
  ) {}

  async execute(id: string, dto: VmUpdateDto): Promise<VmResponseDto> {
    const existingVm = await this.repo.findVmById(id);

    if (dto.groupId) {
      const group = await this.groupRepository.findById(dto.groupId);
      if (group && group.type !== GroupType.VM) {
        throw new GroupTypeMismatchException('vm', group.type);
      }
    }

    const updatedEntity = this.domain.updateVmEntity(existingVm, dto);
    const savedVm = await this.repo.save(updatedEntity);
    return new VmResponseDto(savedVm);
  }
}
