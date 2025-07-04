import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupServer } from '../../domain/entities/group.server.entity';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import { ShutdownStep } from '../dto/shutdown-preview.response.dto';
import { ShutdownPreviewListResponseDto } from '../dto/shutdown-preview.list.response.dto';

@Injectable()
export class PreviewShutdownUseCase {
  constructor(
    @InjectRepository(GroupServer)
    private readonly groupServerRepository: Repository<GroupServer>,
    @InjectRepository(GroupVm)
    private readonly groupVmRepository: Repository<GroupVm>,
  ) {}

  async execute(
    groupIds: string[],
    page = 1,
    limit = 10,
  ): Promise<ShutdownPreviewListResponseDto> {
    const serverGroups = await this.groupServerRepository.find({
      where: { id: In(groupIds) },
      relations: ['servers', 'vmGroups', 'vmGroups.vms'],
    });

    const vmGroups = await this.groupVmRepository.find({
      where: { id: In(groupIds) },
      relations: ['vms'],
    });

    this.validateGroupsFound(groupIds, serverGroups, vmGroups);

    const steps: ShutdownStep[] = [];
    let order = 1;

    order = this.processVmGroups(vmGroups, serverGroups, steps, order);

    this.processServerGroups(serverGroups, steps, order);

    const totalItems = steps.length;
    const totalVms = steps.filter((s) => s.type === 'vm').length;
    const totalServers = steps.filter((s) => s.type === 'server').length;

    const startIndex = Math.max(0, (page - 1) * limit);
    const endIndex = Math.min(steps.length, startIndex + limit);
    const paginatedSteps = steps.slice(startIndex, endIndex);

    return new ShutdownPreviewListResponseDto(
      paginatedSteps,
      totalItems,
      page,
      limit,
      totalVms,
      totalServers,
    );
  }

  private validateGroupsFound(
    groupIds: string[],
    serverGroups: GroupServer[],
    vmGroups: GroupVm[],
  ): void {
    const foundGroupIds = [
      ...serverGroups.map((g) => g.id),
      ...vmGroups.map((g) => g.id),
    ];

    const missingIds = groupIds.filter((id) => !foundGroupIds.includes(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(`Groups not found: ${missingIds.join(', ')}`);
    }
  }

  private processVmGroups(
    vmGroups: GroupVm[],
    serverGroups: GroupServer[],
    steps: ShutdownStep[],
    startOrder: number,
  ): number {
    let order = startOrder;

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
        if (!vm?.id || !vm?.name) continue;
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

    return order;
  }

  private processServerGroups(
    serverGroups: GroupServer[],
    steps: ShutdownStep[],
    startOrder: number,
  ): void {
    let order = startOrder;
    const cascadingServerGroups = serverGroups.filter((g) => g.cascade);
    cascadingServerGroups.sort((a, b) => b.priority - a.priority);

    for (const serverGroup of cascadingServerGroups) {
      if (!serverGroup.servers) continue;

      for (const server of serverGroup.servers) {
        if (!server?.id || !server?.name) continue;
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
  }
}
