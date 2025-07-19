import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SaveDiscoveredVmsUseCase } from '../use-cases/save-discovered-vms.use-case';
import { VmwareDiscoveryService } from '../../domain/services/vmware-discovery.service';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';

@Injectable()
export class VmSyncScheduler {
  private readonly logger = new Logger(VmSyncScheduler.name);
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    private readonly vmwareDiscoveryService: VmwareDiscoveryService,
    private readonly saveDiscoveredVmsUseCase: SaveDiscoveredVmsUseCase,
  ) {}

  @Cron('0 */30 * * * *')
  async syncVMs() {
    const isEnabled = this.configService.get<boolean>('VM_SYNC_ENABLED', true);

    if (!isEnabled) {
      return;
    }

    if (this.isRunning) {
      this.logger.warn('VM sync is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('Starting scheduled VM synchronization');

      const vCenterServer = await this.serverRepository.findServerByTypeWithCredentials('vcenter');

      if (!vCenterServer) {
        this.logger.warn('No vCenter server found for VM sync');
        return;
      }

      this.logger.log(
        `Starting VM sync from vCenter: ${vCenterServer.name} (${vCenterServer.ip})`,
      );

      let totalVMsDiscovered = 0;
      let totalChangesDetected = 0;
      const errors: Array<{ serverName: string; error: string }> = [];

      try {
        this.logger.log('Discovering all VMs from vCenter...');

        const discoveryResult =
          await this.vmwareDiscoveryService.discoverVmsFromServer(
            vCenterServer,
          );

        const discoveredVms = discoveryResult.vms || [];

        if (discoveredVms && discoveredVms.length > 0) {
          const vmsByHost = new Map<string, number>();
          discoveredVms.forEach((vm) => {
            const host = vm.esxiHostMoid || 'unknown';
            vmsByHost.set(host, (vmsByHost.get(host) || 0) + 1);
          });

          this.logger.log(
            `Discovered ${discoveredVms.length} VMs across ${vmsByHost.size} ESXi hosts`,
          );

          const result = await this.saveDiscoveredVmsUseCase.execute({
            vms: discoveredVms,
            serverId: vCenterServer.id,
          });

          totalVMsDiscovered = discoveredVms.length;
          totalChangesDetected = result.changes || 0;

          this.logger.log(
            `VM sync results: ${result.created || 0} created, ${result.updated || 0} updated, ` +
              `${totalChangesDetected} total changes`,
          );

          vmsByHost.forEach((count, host) => {
            this.logger.debug(`ESXi host ${host}: ${count} VMs`);
          });
        } else {
          this.logger.warn('No VMs discovered from vCenter');
        }
      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        errors.push({ serverName: vCenterServer.name, error: errorMessage });
        this.logger.error(
          `Failed to sync VMs from vCenter: ${errorMessage}`,
          error.stack,
        );
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.logger.log(
        `VM sync completed in ${duration}s - ` +
          `Total VMs: ${totalVMsDiscovered}, Changes: ${totalChangesDetected}, ` +
          `Errors: ${errors.length}`,
      );

      if (errors.length > 0) {
        this.logger.warn('VM sync completed with errors:', errors);
      }
    } catch (error) {
      this.logger.error('VM sync scheduler failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger VM synchronization
   * Used by the API endpoint for on-demand sync
   */
  async triggerManualSync(): Promise<{
    success: boolean;
    message: string;
    totalVMs?: number;
    changes?: number;
    duration?: string;
    errors?: Array<{ serverName: string; error: string }>;
  }> {
    if (this.isRunning) {
      return {
        success: false,
        message: 'VM synchronization is already in progress',
      };
    }

    const startTime = Date.now();

    try {
      await this.syncVMs();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      return {
        success: true,
        message: 'VM synchronization completed successfully',
        duration: `${duration}s`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'VM synchronization failed',
        errors: [{ serverName: 'System', error: error.message }],
      };
    }
  }
}
