import { Injectable, Logger, Inject } from '@nestjs/common';
import { VmRepositoryInterface } from '../../../vms/domain/interfaces/vm.repository.interface';
import { VmDomainService } from '../../../vms/domain/services/vm.domain.service';
import { DiscoveredVmDto } from '../dto';
import { VmCreationDto } from '../../../vms/application/dto/vm.creation.dto';
import { Vm } from '../../../vms/domain/entities/vm.entity';

export interface SaveDiscoveredVmsResult {
  savedCount: number;
  failedCount: number;
  savedVms: Vm[];
  errors: Array<{ vm: string; error: string }>;
  created?: number;
  updated?: number;
  changes?: number;
}

@Injectable()
export class SaveDiscoveredVmsUseCase {
  private readonly logger = new Logger(SaveDiscoveredVmsUseCase.name);

  constructor(
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
    private readonly vmDomainService: VmDomainService,
  ) {}

  async execute(
    dto: { vms: DiscoveredVmDto[]; serverId?: string },
  ): Promise<SaveDiscoveredVmsResult> {
    const discoveredVms = dto.vms;
    this.logger.log(`Saving ${discoveredVms.length} discovered VMs`);

    const vmsByServer = new Map<
      string,
      { vm: DiscoveredVmDto; priority: number }[]
    >();

    for (const vm of discoveredVms) {
      if (!vmsByServer.has(vm.serverId)) {
        vmsByServer.set(vm.serverId, []);
      }
      vmsByServer.get(vm.serverId)!.push({ vm, priority: 0 });
    }

    await this.calculateUniquePriorities(vmsByServer);

    const result: SaveDiscoveredVmsResult = {
      savedCount: 0,
      failedCount: 0,
      savedVms: [],
      errors: [],
      created: 0,
      updated: 0,
      changes: 0,
    };

    for (const [_, serverVms] of vmsByServer.entries()) {
      for (const { vm: discoveredVm, priority } of serverVms) {
        try {
          const existingVm = await this.vmRepository.findOne({
            where: {
              moid: discoveredVm.moid,
              serverId: discoveredVm.serverId,
            },
          });

          if (existingVm) {
            const hasChanges =
              existingVm.name !== discoveredVm.name ||
              existingVm.state !== (discoveredVm.powerState ?? 'unknown') ||
              existingVm.ip !== discoveredVm.ip ||
              existingVm.guestOs !== discoveredVm.guestOs ||
              existingVm.numCPU !== discoveredVm.numCpu ||
              existingVm.esxiHostMoid !== discoveredVm.esxiHostMoid;

            if (hasChanges) {
              const changes: string[] = [];
              
              if (existingVm.name !== discoveredVm.name) {
                changes.push(`name: ${existingVm.name} → ${discoveredVm.name}`);
              }
              if (existingVm.state !== (discoveredVm.powerState ?? 'unknown')) {
                changes.push(`state: ${existingVm.state} → ${discoveredVm.powerState}`);
              }
              if (existingVm.ip !== discoveredVm.ip) {
                changes.push(`ip: ${existingVm.ip || 'none'} → ${discoveredVm.ip || 'none'}`);
              }
              if (existingVm.numCPU !== discoveredVm.numCpu) {
                changes.push(`cpu: ${existingVm.numCPU} → ${discoveredVm.numCpu}`);
              }
              if (existingVm.esxiHostMoid !== discoveredVm.esxiHostMoid) {
                changes.push(`host: ${existingVm.esxiHostMoid || 'none'} → ${discoveredVm.esxiHostMoid || 'none'}`);
                this.logger.log(
                  `VM ${discoveredVm.name} migrated from host ${existingVm.esxiHostMoid} to ${discoveredVm.esxiHostMoid}`,
                );
              }

              existingVm.name = discoveredVm.name;
              existingVm.state = discoveredVm.powerState ?? 'unknown';
              existingVm.ip = discoveredVm.ip || existingVm.ip;
              existingVm.guestOs = discoveredVm.guestOs || existingVm.guestOs;
              existingVm.numCPU = discoveredVm.numCpu || existingVm.numCPU;
              existingVm.esxiHostMoid =
                discoveredVm.esxiHostMoid || existingVm.esxiHostMoid;
              existingVm.lastSyncAt = new Date();

              const updatedVm = await this.vmRepository.save(existingVm);
              result.savedVms.push(updatedVm);
              result.savedCount++;
              result.updated++;
              result.changes++;

              this.logger.log(
                `Updated VM ${discoveredVm.name} (${discoveredVm.moid}) - Changes: ${changes.join(', ')}`,
              );
            } else {
              this.logger.debug(
                `VM ${discoveredVm.name} (moid: ${discoveredVm.moid}) already exists with no changes, skipping`,
              );
            }
            continue;
          }

          const vmCreationDto: VmCreationDto = {
            name: discoveredVm.name,
            state: discoveredVm.powerState ?? 'unknown',
            grace_period_on: 0,
            grace_period_off: 0,
            priority: priority,
            serverId: discoveredVm.serverId,
            moid: discoveredVm.moid,
            ip: discoveredVm.ip || undefined,
            guestOs: discoveredVm.guestOs || undefined,
            numCPU: discoveredVm.numCpu || undefined,
            esxiHostMoid: discoveredVm.esxiHostMoid || undefined,
          };

          const vmEntity = this.vmDomainService.createVmEntity(vmCreationDto);
          vmEntity.lastSyncAt = new Date();
          const savedVm = await this.vmRepository.save(vmEntity);

          result.savedVms.push(savedVm);
          result.savedCount++;
          result.created++;
          result.changes++;

          this.logger.log(
            `Created new VM ${discoveredVm.name} on ESXi host ${discoveredVm.esxiHostMoid || 'unknown'} with priority ${priority}`,
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({
            vm: discoveredVm.name,
            error: errorMessage,
          });
          result.failedCount++;

          this.logger.error(
            `Failed to save VM ${discoveredVm.name}:`,
            errorMessage,
          );
        }
      }
    }

    this.logger.log(
      `VM sync completed: ${result.created} created, ${result.updated} updated, ` +
      `${result.failedCount} failed, ${result.changes} total changes`,
    );

    return result;
  }

  private async calculateUniquePriorities(
    vmsByServer: Map<string, { vm: DiscoveredVmDto; priority: number }[]>,
  ): Promise<void> {
    for (const [serverId, serverVms] of vmsByServer.entries()) {
      const existingVms = await this.vmRepository.findAll();
      const serverExistingVms = existingVms.filter(
        (vm) => vm.serverId === serverId,
      );

      const existingPriorities = new Set(
        serverExistingVms.map((vm: Vm) => vm.priority),
      );

      let nextPriority = 1;
      for (const vmData of serverVms) {
        while (existingPriorities.has(nextPriority)) {
          nextPriority++;
        }

        vmData.priority = nextPriority;
        existingPriorities.add(nextPriority);
        nextPriority++;
      }
    }
  }
}
