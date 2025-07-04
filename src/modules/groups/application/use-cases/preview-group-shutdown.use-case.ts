import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupRepository } from '../../infrastructure/repositories/group.repository';
import {
  PreviewShutdownResponseDto,
  ShutdownResourceDto,
} from '../dto/preview-shutdown-response.dto';
import { GroupType } from '../../domain/enums/group-type.enum';
import { Vm } from '../../../vms/domain/entities/vm.entity';
import { Server } from '../../../servers/domain/entities/server.entity';

@Injectable()
export class PreviewGroupShutdownUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    @InjectRepository(Vm)
    private readonly vmRepository: Repository<Vm>,
    @InjectRepository(Server)
    private readonly serverRepository: Repository<Server>,
  ) {}

  async execute(groupId: string): Promise<PreviewShutdownResponseDto> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with id "${groupId}" not found`);
    }

    let resources: ShutdownResourceDto[] = [];

    if (group.type === GroupType.VM) {
      const vms = await this.vmRepository.find({
        where: { groupId },
        order: { priority: 'ASC' },
      });

      resources = vms.map((vm, index) => ({
        id: vm.id,
        name: vm.name,
        priority: vm.priority,
        state: vm.state,
        shutdownOrder: index + 1,
      }));
    } else {
      const servers = await this.serverRepository.find({
        where: { groupId },
        order: { priority: 'ASC' },
      });

      resources = servers.map((server, index) => ({
        id: server.id,
        name: server.name,
        priority: server.priority,
        state: server.state,
        shutdownOrder: index + 1,
      }));
    }

    return {
      groupId: group.id,
      groupName: group.name,
      groupType: group.type,
      resources,
      totalResources: resources.length,
      estimatedDuration: this.calculateEstimatedDuration(resources),
    };
  }

  private calculateEstimatedDuration(resources: ShutdownResourceDto[]): number {
    return resources.length * 30;
  }
}
