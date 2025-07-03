import { Inject, Injectable } from '@nestjs/common';
import { VmRepositoryInterface } from '../../domain/interfaces/vm.repository.interface';
import { VmDomainService } from '../../domain/services/vm.domain.service';
import { VmCreationDto } from '../dto/vm.creation.dto';
import { VmResponseDto } from '../dto/vm.response.dto';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { RequestContextDto } from '@/core/dto';

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
    @Inject('ServerRepositoryInterface')
    private readonly serverRepo: ServerRepositoryInterface,
    private readonly logHistory?: LogHistoryUseCase,
  ) {}

  async execute(
    dto: VmCreationDto,
    userId?: string,
    requestContext?: RequestContextDto,
  ): Promise<VmResponseDto> {
    const server = await this.serverRepo.findOneByField({
      field: 'id',
      value: dto.serverId,
      relations: ['room'],
    });

    const entity = this.domain.createVmEntity(dto);
    const vm = await this.repo.save(entity);

    await this.logHistory?.executeStructured({
      entity: 'vm',
      entityId: vm.id,
      action: 'CREATE',
      userId,
      newValue: {
        name: vm.name,
        state: vm.state,
        os: vm.os,
        ip: vm.ip,
        serverId: vm.serverId,
        serverHostname: server?.name,
        roomId: server?.roomId,
        roomName: server?.room?.name,
        priority: vm.priority,
        groupId: vm.groupId,
      },
      metadata: {
        vmType: 'virtual',
        operatingSystem: vm.os,
        parentServer: server?.name,
        createdOnServer: vm.serverId,
        assignedToGroup: !!vm.groupId,
        priority: vm.priority,
      },
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    return new VmResponseDto(vm);
  }
}
