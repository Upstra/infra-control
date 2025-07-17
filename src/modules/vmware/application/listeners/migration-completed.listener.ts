import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MigrationCompletedEvent } from '../../domain/interfaces/migration-completed-event.interface';
import { VmwareService } from '../../domain/services/vmware.service';
import { VmwareConnectionService } from '../../domain/services/vmware-connection.service';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

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
    private readonly logHistory: LogHistoryUseCase,
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

    try {
      // UNE SEULE requête pour récupérer toutes les VMs du vCenter
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

      // Mettre à jour chaque VM migrée
      for (const vmMoid of vmMoids) {
        try {
          await this.updateSingleVm(vmMoid, allVms, userId, vCenterServer);
        } catch (error) {
          this.logger.error(`Failed to update VM ${vmMoid}:`, error);
        }
      }
    } catch (vmwareError) {
      this.logger.error('Failed to connect to vCenter:', vmwareError);

      // Log l'erreur pour toutes les VMs
      if (userId) {
        for (const vmMoid of vmMoids) {
          await this.logVmUpdateError(vmMoid, vmwareError, userId);
        }
      }
    }
  }

  private async updateSingleVm(
    vmMoid: string,
    allVms: any[],
    userId?: string,
    vCenterServer?: any,
  ): Promise<void> {
    const vm = await this.vmRepository.findOne({ where: { moid: vmMoid } });
    if (!vm) {
      this.logger.warn(`VM ${vmMoid} not found in database`);
      return;
    }

    const vmInfo = allVms.find((v) => v.moid === vmMoid);
    if (!vmInfo) {
      this.logger.warn(
        `VM ${vmMoid} not found in vCenter among ${allVms.length} VMs`,
      );
      return;
    }

    const newHostMoid = vmInfo.esxiHostMoid;

    if (vm.esxiHostMoid !== newHostMoid) {
      const oldHostMoid = vm.esxiHostMoid;

      vm.esxiHostMoid = newHostMoid;
      await this.vmRepository.save(vm);

      this.logger.log(
        `Updated VM ${vm.name} from host ${oldHostMoid} to ${newHostMoid}`,
      );

      if (userId) {
        await this.logHistory.executeStructured({
          entity: 'vm',
          entityId: vm.id,
          action: 'UPDATE_HOST',
          userId,
          oldValue: { esxiHostMoid: oldHostMoid },
          newValue: { esxiHostMoid: newHostMoid },
          metadata: {
            reason: 'migration_completed',
            vmName: vm.name,
            vmMoid: vmMoid,
            vCenterIp: vCenterServer?.ip,
          },
        });
      }
    } else {
      this.logger.debug(`VM ${vm.name} already on correct host ${newHostMoid}`);
    }
  }

  private async getVCenterServer(): Promise<any> {
    try {
      const servers = await this.serverRepository.findAll();
      return servers.find((server) => server.type === 'vcenter');
    } catch (error) {
      this.logger.error('Failed to get vCenter server:', error);
      return null;
    }
  }

  private async logVmUpdateError(
    vmMoid: string,
    error: any,
    userId: string,
  ): Promise<void> {
    try {
      const vm = await this.vmRepository.findOne({ where: { moid: vmMoid } });
      if (vm) {
        await this.logHistory.executeStructured({
          entity: 'vm',
          entityId: vm.id,
          action: 'MIGRATION_COMPLETED',
          userId,
          metadata: {
            reason: 'migration_completed',
            vmName: vm.name,
            vmMoid: vmMoid,
            note: 'Could not verify new host - will update on next sync',
            error: error.message,
          },
        });
      }
    } catch (logError) {
      this.logger.error(`Failed to log error for VM ${vmMoid}:`, logError);
    }
  }
}
