import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MigrationCompletedEvent } from '../../domain/interfaces/migration-completed-event.interface';
import { VmwareService } from '../../domain/services/vmware.service';
import { VmwareConnectionService } from '../../domain/services/vmware-connection.service';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import {
  VmUpdateResponse,
  VmUpdateBatchResults,
} from '../../domain/interfaces/vm-update.interface';

@Injectable()
export class MigrationCompletedListener {
  private readonly logger = new Logger(MigrationCompletedListener.name);

  constructor(
    private readonly vmwareService: VmwareService,
    private readonly vmwareConnectionService: VmwareConnectionService,
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
  ) {}

  @OnEvent('migration.completed', { async: true })
  async handleMigrationCompleted(
    event: MigrationCompletedEvent,
  ): Promise<void> {
    this.logger.log(
      `Processing migration completed event for session ${event.sessionId}`,
    );

    if (event.migrationType === 'shutdown') {
      this.logger.log('Shutdown migration, no VM updates needed');
      return;
    }

    if (event.successfulVms.length === 0) {
      this.logger.log('No successful VMs to update');
      return;
    }

    try {
      await this.updateAllMigratedVms(event.successfulVms, event.userId);
    } catch (error) {
      this.logger.error('Failed to update migrated VMs:', error);
    }
  }

  private async updateAllMigratedVms(
    vmMoids: string[],
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Updating ${vmMoids.length} migrated VMs`);
    const vCenterServer = await this.getVCenterServer();
    if (!vCenterServer) {
      this.logger.warn('No vCenter server found');
      return;
    }

    const updateResults: VmUpdateBatchResults = {
      successful: [],
      failed: [],
      unchanged: [],
    };

    try {
      const connection =
        this.vmwareConnectionService.buildVmwareConnection(vCenterServer);
      const allVms = await this.vmwareService.listVMs(connection);

      if (!Array.isArray(allVms) || allVms.length === 0) {
        this.logger.warn(`No VMs found in vCenter ${vCenterServer.name}`);
        return;
      }

      this.logger.log(
        `Retrieved ${allVms.length} VMs from vCenter, processing ${vmMoids.length} migrated VMs`,
      );

      for (const vmMoid of vmMoids) {
        try {
          const result = await this.updateSingleVm(vmMoid, allVms);
          if (result) {
            updateResults[result.status].push(result.data);
          }
        } catch (error) {
          this.logger.error(`Failed to update VM ${vmMoid}:`, error);
          updateResults.failed.push({
            vmMoid,
            vmName: 'unknown',
            error: error.message,
          });
        }
      }
    } catch (vmwareError) {
      this.logger.error('Failed to connect to vCenter:', vmwareError);

      for (const vmMoid of vmMoids) {
        updateResults.failed.push({
          vmMoid,
          vmName: 'unknown',
          error: `vCenter connection failed: ${vmwareError.message}`,
        });
      }
    }

    this.logger.log(
      `Batch VM update completed: ${updateResults.successful.length} updated, ${updateResults.unchanged.length} unchanged, ${updateResults.failed.length} failed`,
    );
  }

  private async updateSingleVm(
    vmMoid: string,
    allVms: any[],
  ): Promise<VmUpdateResponse | null> {
    const vm = await this.vmRepository.findOne({ where: { moid: vmMoid } });
    if (!vm) {
      this.logger.warn(`VM ${vmMoid} not found in database`);
      return {
        status: 'failed',
        data: {
          vmMoid,
          vmName: 'unknown',
          error: 'VM not found in database',
        },
      };
    }

    const vmInfo = allVms.find((v) => v.moid === vmMoid);
    if (!vmInfo) {
      this.logger.warn(
        `VM ${vmMoid} not found in vCenter among ${allVms.length} VMs`,
      );
      return {
        status: 'failed',
        data: {
          vmMoid,
          vmName: vm.name,
          error: 'VM not found in vCenter',
        },
      };
    }

    const newHostMoid = vmInfo.esxiHostMoid;

    if (vm.esxiHostMoid !== newHostMoid) {
      const oldHostMoid = vm.esxiHostMoid;

      vm.esxiHostMoid = newHostMoid;
      await this.vmRepository.save(vm);

      this.logger.log(
        `Updated VM ${vm.name} from host ${oldHostMoid} to ${newHostMoid}`,
      );

      return {
        status: 'successful',
        data: {
          vmMoid,
          vmName: vm.name,
          oldHost: oldHostMoid || 'unknown',
          newHost: newHostMoid,
        },
      };
    } else {
      await this.vmRepository.save(vm);

      this.logger.debug(`VM ${vm.name} already on correct host ${newHostMoid}`);
      return {
        status: 'unchanged',
        data: {
          vmMoid,
          vmName: vm.name,
          host: newHostMoid,
        },
      };
    }
  }

  private async getVCenterServer(): Promise<Server> {
    try {
      const servers = await this.serverRepository.findAll();
      return servers.find((server) => server.type === 'vcenter');
    } catch (error) {
      this.logger.error('Failed to get vCenter server:', error);
      return null;
    }
  }
}
