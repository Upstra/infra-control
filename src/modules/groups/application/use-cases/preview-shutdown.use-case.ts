import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupServer } from '../../domain/entities/group.server.entity';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import {
  ShutdownPreviewResponseDto,
  ShutdownStep,
} from '../dto/shutdown-preview.response.dto';

@Injectable()
export class PreviewShutdownUseCase {
  constructor(
    @InjectRepository(GroupServer)
    private readonly groupServerRepository: Repository<GroupServer>,
    @InjectRepository(GroupVm)
    private readonly groupVmRepository: Repository<GroupVm>,
  ) {}

  async execute(groupIds: string[]): Promise<ShutdownPreviewResponseDto> {
    const serverGroups = await this.groupServerRepository.find({
      where: { id: In(groupIds) },
      relations: ['servers', 'vmGroups', 'vmGroups.vms'],
    });

    const vmGroups = await this.groupVmRepository.find({
      where: { id: In(groupIds) },
      relations: ['vms'],
    });

    const foundGroupIds = [
      ...serverGroups.map((g) => g.id),
      ...vmGroups.map((g) => g.id),
    ];

    const missingIds = groupIds.filter((id) => !foundGroupIds.includes(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(`Groups not found: ${missingIds.join(', ')}`);
    }

    const steps: ShutdownStep[] = [];
    let order = 1;

    const allVmGroups = [
      ...vmGroups,
      ...serverGroups.filter((g) => g.cascade).flatMap((g) => g.vmGroups ?? []),
    ];

    const uniqueVmGroups = Array.from(
      new Map(allVmGroups.map((g) => [g.id, g])).values(),
    );

    uniqueVmGroups.sort((a, b) => b.priority - a.priority);

    for (const vmGroup of uniqueVmGroups) {
      if (!vmGroup.vms) continue;

      for (const vm of vmGroup.vms) {
        steps.push(
          new ShutdownStep({
            order: order++,
            type: 'vm',
            entityId: vm.id,
            entityName: vm.name,
            groupId: vmGroup.id,
            groupName: vmGroup.name,
            priority: vmGroup.priority,
          }),
        );
      }
    }

    const cascadingServerGroups = serverGroups.filter((g) => g.cascade);
    cascadingServerGroups.sort((a, b) => b.priority - a.priority);

    for (const serverGroup of cascadingServerGroups) {
      if (!serverGroup.servers) continue;

      for (const server of serverGroup.servers) {
        steps.push(
          new ShutdownStep({
            order: order++,
            type: 'server',
            entityId: server.id,
            entityName: server.name,
            groupId: serverGroup.id,
            groupName: serverGroup.name,
            priority: serverGroup.priority,
          }),
        );
      }
    }

    return new ShutdownPreviewResponseDto(steps);
  }
}
