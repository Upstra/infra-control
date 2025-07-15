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
    discoveredVms: DiscoveredVmDto[],
  ): Promise<SaveDiscoveredVmsResult> {
    this.logger.log(`Saving ${discoveredVms.length} discovered VMs`);

    const result: SaveDiscoveredVmsResult = {
      savedCount: 0,
      failedCount: 0,
      savedVms: [],
      errors: [],
    };

    for (const discoveredVm of discoveredVms) {
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
            existingVm.name = discoveredVm.name;
            existingVm.state = discoveredVm.powerState ?? 'unknown';
            existingVm.ip = discoveredVm.ip || existingVm.ip;
            existingVm.guestOs = discoveredVm.guestOs || existingVm.guestOs;
            existingVm.numCPU = discoveredVm.numCpu || existingVm.numCPU;
            existingVm.esxiHostMoid =
              discoveredVm.esxiHostMoid || existingVm.esxiHostMoid;

            const updatedVm = await this.vmRepository.save(existingVm);
            result.savedVms.push(updatedVm);
            result.savedCount++;

            this.logger.debug(
              `Updated existing VM ${discoveredVm.name} (moid: ${discoveredVm.moid})`,
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
          priority: 100,
          serverId: discoveredVm.serverId,
          moid: discoveredVm.moid,
          ip: discoveredVm.ip || undefined,
          guestOs: discoveredVm.guestOs || undefined,
          numCPU: discoveredVm.numCpu || undefined,
          esxiHostMoid: discoveredVm.esxiHostMoid || undefined,
        };

        const vmEntity = this.vmDomainService.createVmEntity(vmCreationDto);
        const savedVm = await this.vmRepository.save(vmEntity);

        result.savedVms.push(savedVm);
        result.savedCount++;

        this.logger.debug(
          `Successfully saved VM ${discoveredVm.name} (id: ${savedVm.id})`,
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

    this.logger.log(
      `VM save operation completed: ${result.savedCount} saved, ${result.failedCount} failed`,
    );

    return result;
  }
}
