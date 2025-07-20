import { Injectable, Inject } from '@nestjs/common';
import { IMailService } from '../../domain/services/mail.service';
import { SendEmailDto } from '../dto/send-email.dto';
import { EmailAddressVO } from '../../domain/value-objects/email-address.vo';
import { MigrationCompletedEvent } from '../../../vmware/domain/interfaces/migration-completed-event.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { MAIL_SERVICE_TOKEN } from '../../domain/constants/injection-tokens';

@Injectable()
export class SendMigrationCompletedEmailUseCase {
  constructor(
    @Inject(MAIL_SERVICE_TOKEN)
    private readonly mailService: IMailService,
  ) {}

  async execute(params: {
    admin: User;
    migrationEvent: MigrationCompletedEvent;
  }): Promise<void> {
    const { admin, migrationEvent } = params;

    const emailDto: SendEmailDto = {
      to: EmailAddressVO.create(admin.email),
      subject: this.generateSubject(migrationEvent),
      template: 'migration-completed',
      context: {
        username: admin.username,
        migrationType: migrationEvent.migrationType,
        sessionId: migrationEvent.sessionId,
        totalVms: migrationEvent.affectedVms.length,
        successfulVms: migrationEvent.successfulVms.length,
        failedVms: migrationEvent.failedVms.length,
        affectedVms: migrationEvent.affectedVms.map((vm) => ({
          name: vm.name || vm.moid,
          sourceHost: this.getSourceHost(vm, migrationEvent),
          targetHost: this.getTargetHost(vm, migrationEvent),
          status: migrationEvent.successfulVms.includes(vm.moid)
            ? 'success'
            : 'failed',
        })),
        events: this.formatEvents(migrationEvent.events),
        completedAt: new Date().toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'medium',
        }),
      },
    };

    await this.mailService.send(emailDto);
  }

  private generateSubject(event: MigrationCompletedEvent): string {
    const typeLabels = {
      migration: 'Migration',
      shutdown: 'Arrêt',
      restart: 'Redémarrage',
    };

    const typeLabel = typeLabels[event.migrationType] || event.migrationType;
    const status = event.failedVms.length > 0 ? 'avec erreurs' : 'réussie';

    return `[Infrastructure Control] ${typeLabel} terminée ${status} - ${event.affectedVms.length} VM(s)`;
  }

  private getSourceHost(vm: any, event: MigrationCompletedEvent): string {
    const migrationEvent = event.events.find(
      (e) => e.type === 'vm_migration' && e.vmMoid === vm.moid,
    );
    return migrationEvent?.sourceMoid || vm.sourceServer || 'N/A';
  }

  private getTargetHost(vm: any, event: MigrationCompletedEvent): string {
    const migrationEvent = event.events.find(
      (e) => e.type === 'vm_migration' && e.vmMoid === vm.moid,
    );
    return migrationEvent?.destinationMoid || vm.destinationServer || 'N/A';
  }

  private formatEvents(events: any[]): any[] {
    return events
      .filter((e) => e.type !== 'grace_period')
      .map((event) => ({
        type: this.getEventTypeLabel(event.type),
        message: event.message,
        timestamp: new Date(event.timestamp).toLocaleTimeString('fr-FR'),
        status: event.success ? 'success' : 'error',
      }))
      .slice(-10);
  }

  private getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      vm_migration: 'Migration VM',
      vm_shutdown: 'Arrêt VM',
      vm_started: 'Démarrage VM',
      server_shutdown: 'Arrêt serveur',
      start_shutdown: 'Début arrêt',
      finish_shutdown: 'Fin arrêt',
    };
    return labels[type] || type;
  }
}
