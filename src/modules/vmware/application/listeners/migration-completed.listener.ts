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

    for (const vmMoid of event.successfulVms) {
      try {
        await this.updateVmLocation(vmMoid, event.userId);
      } catch (error) {
        this.logger.error(`Failed to update VM ${vmMoid}:`, error);
      }
    }
  }

  private async updateVmLocation(
    vmMoid: string,
    userId?: string,
  ): Promise<void> {
    try {
      const vm = await this.vmRepository.findOne({ where: { moid: vmMoid } });
      if (!vm) {
        this.logger.warn(`VM ${vmMoid} not found in database`);
        return;
      }

      if (!vm.serverId) {
        this.logger.warn(`VM ${vmMoid} has no associated server`);
        return;
      }

      const server = await this.serverRepository.findOneByField({
        field: 'id',
        value: vm.serverId,
      });

      if (!server || server.type !== 'vcenter') {
        this.logger.warn(`Server ${vm.serverId} not found or is not a vCenter`);
        return;
      }

      try {
        const connection =
          this.vmwareConnectionService.buildVmwareConnection(server);

        const vmList = await this.vmwareService.listVMs(connection);
        
        if (!Array.isArray(vmList) || vmList.length === 0) {
          this.logger.warn(`No VMs found in vCenter for server ${server.name}`);
          return;
        }

        const vmInfo = vmList.find(v => v.moid === vmMoid);
        
        if (!vmInfo) {
          this.logger.warn(`VM ${vmMoid} not found in vCenter among ${vmList.length} VMs`);
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
                vCenterIp: server.ip,
              },
            });
          }
        } else {
          this.logger.debug(
            `VM ${vm.name} already on correct host ${newHostMoid}`,
          );
        }
      } catch (vmwareError) {
        this.logger.error(
          `Failed to connect to vCenter or get VM info:`,
          vmwareError,
        );
        if (userId) {
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
              error: vmwareError.message,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing VM migration completion for ${vmMoid}:`,
        error,
      );
      throw error;
    }
  }
}
