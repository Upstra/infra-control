import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SyncServerVmwareDataUseCase } from '../use-cases/sync-server-vmware-data.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import {
  EmailEventType,
  VmwareSyncReportEvent,
} from '@/modules/email/domain/events/email.events';

@Injectable()
export class VmwareSyncScheduler {
  private readonly logger = new Logger(VmwareSyncScheduler.name);
  private readonly isEnabled: boolean;

  constructor(
    private readonly syncServerVmwareData: SyncServerVmwareDataUseCase,
    @Inject('ServerRepositoryInterface')
    private readonly serverRepository: ServerRepositoryInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.isEnabled =
      this.configService.get('VMWARE_SYNC_ENABLED', 'true') === 'true';
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async syncAllVmwareServers(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.debug('VMware sync is disabled');
      return;
    }

    this.logger.log('Starting daily VMware sync');
    const startTime = Date.now();
    const report = {
      totalServers: 0,
      successfulServers: 0,
      failedServers: 0,
      vmsUpdated: 0,
      errors: [] as string[],
    };

    try {
      const servers = await this.serverRepository.findAll();

      const vmwareServers = servers.filter(
        (server) => server.type === 'vcenter' || server.type === 'esxi',
      );
      report.totalServers = vmwareServers.length;

      for (const server of vmwareServers) {
        try {
          this.logger.log(`Syncing server ${server.name} (${server.id})`);

          const result = await this.syncServerVmwareData.execute({
            serverId: server.id,
            fullSync: true,
          });

          report.successfulServers++;
          report.vmsUpdated += result.vmsUpdated || 0;
        } catch (error) {
          report.failedServers++;
          const errorMsg = `Failed to sync server ${server.name}: ${error.message}`;
          report.errors.push(errorMsg);
          this.logger.error(errorMsg, error.stack);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`VMware sync completed in ${duration}ms`, report);

      if (report.errors.length > 0) {
        await this.sendSyncReport(report, duration);
      }
    } catch (error) {
      this.logger.error('VMware sync scheduler failed:', error);
    }
  }

  private async sendSyncReport(report: any, duration: number): Promise<void> {
    try {
      const adminUsers = await this.userRepository.findAll(['roles']);

      const adminEmails = adminUsers
        .filter(
          (user) =>
            user.isActive && user.roles?.some((role) => role.isAdmin === true),
        )
        .map((user) => user.email);

      if (adminEmails.length === 0) {
        this.logger.warn('No admin users found to send sync report');
        return;
      }

      const event: VmwareSyncReportEvent = {
        adminEmails,
        date: new Date().toLocaleString('fr-FR'),
        duration: (duration / 1000).toFixed(2),
        totalServers: report.totalServers,
        successfulServers: report.successfulServers,
        failedServers: report.failedServers,
        vmsUpdated: report.vmsUpdated,
        errors: report.errors,
      };

      this.eventEmitter.emit(EmailEventType.VMWARE_SYNC_REPORT, event);
    } catch (error) {
      this.logger.error('Failed to send sync report email:', error);
    }
  }
}
