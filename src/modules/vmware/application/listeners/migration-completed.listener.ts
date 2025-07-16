import { Injectable, Logger, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MigrationCompletedEvent } from '../../domain/interfaces/migration-completed-event.interface';
import { VmwareService } from '../../domain/services/vmware.service';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';

@Injectable()
export class MigrationCompletedListener {
  private readonly logger = new Logger(MigrationCompletedListener.name);

  constructor(
    private readonly vmwareService: VmwareService,
    @Inject('VmRepositoryInterface')
    private readonly vmRepository: VmRepositoryInterface,
    private readonly logHistory: LogHistoryUseCase,
  ) {}

  @OnEvent('migration.completed', { async: true })
  async handleMigrationCompleted(event: MigrationCompletedEvent): Promise<void> {
    this.logger.log(`Processing migration completed event for session ${event.sessionId}`);

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

  private async updateVmLocation(vmMoid: string, userId?: string): Promise<void> {
    try {
      const vm = await this.vmRepository.findOne({ where: { moid: vmMoid } });
      if (!vm) {
        this.logger.warn(`VM ${vmMoid} not found in database`);
        return;
      }

      const vmwareInfo = await this.vmwareService.getVmInfo(vmMoid);
      if (!vmwareInfo || !vmwareInfo.runtime?.host) {
        this.logger.warn(`Could not get host info for VM ${vmMoid} from vCenter`);
        return;
      }

      const newHostMoid = vmwareInfo.runtime.host.value;
      
      if (vm.serverMoid === newHostMoid) {
        this.logger.debug(`VM ${vm.name} already on correct host`);
        return;
      }

      const oldHostMoid = vm.serverMoid;
      
      await this.vmRepository.update(vm.id, { serverMoid: newHostMoid });

      if (userId) {
        await this.logHistory.executeStructured({
          entity: 'vm',
          entityId: vm.id,
          action: 'UPDATE_HOST',
          userId,
          oldValue: { serverMoid: oldHostMoid },
          newValue: { serverMoid: newHostMoid },
          metadata: {
            reason: 'migration_completed',
            vmName: vm.name,
            vmMoid: vmMoid,
          },
        });
      }

      this.logger.log(`Updated VM ${vm.name} from host ${oldHostMoid} to ${newHostMoid}`);
    } catch (error) {
      this.logger.error(`Error updating VM ${vmMoid}:`, error);
      throw error;
    }
  }
}