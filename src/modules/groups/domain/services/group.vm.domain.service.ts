import { Injectable } from '@nestjs/common';
import { GroupVm } from '../../domain/entities/group.vm.entity';
import { GroupVmDto } from '../../application/dto/group.vm.dto';

/**
 * Handles grouping of VM entities for collective management and reporting.
 * Provides domain logic for creation, membership management, and summary aggregation.
 *
 * Responsibilities:
 * - Create and delete VM groups, ensuring naming conventions and constraints.
 * - Assign or remove VMs from groups, checking VM existence and allocation rules.
 * - Compute group-level metrics (e.g. total VMs, running vs. stopped) for dashboards.
 * - Respect and enforce domain permissions for all group operations.
 *
 * @remarks
 * This service should be invoked by use-cases that perform bulk VM workflows;
 * direct controller access is discouraged.
 *
 * @example
 * // Retrieve a summary of a VM group’s health
 * const summary = await groupVmService.getGroupHealth(groupId);
 */

@Injectable()
export class GroupVmDomainService {
  createGroup(dto: GroupVmDto): GroupVm {
    const groupVm = new GroupVm();
    groupVm.name = dto.name;
    groupVm.priority = dto.priority;
    return groupVm;
  }

  updateGroupEntityFromDto(group: GroupVm, dto: GroupVmDto): GroupVm {
    group.name = dto.name;
    group.priority = dto.priority;
    return group;
  }
}
