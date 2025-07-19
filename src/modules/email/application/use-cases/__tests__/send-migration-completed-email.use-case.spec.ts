import { Test, TestingModule } from '@nestjs/testing';
import { SendMigrationCompletedEmailUseCase } from '../send-migration-completed-email.use-case';
import { IMailService } from '../../../domain/services/mail.service';
import { EmailAddressVO } from '../../../domain/value-objects/email-address.vo';
import { MigrationCompletedEvent } from '../../../../vmware/domain/interfaces/migration-completed-event.interface';
import { User } from '../../../../users/domain/entities/user.entity';
import { MAIL_SERVICE_TOKEN } from '../../../domain/constants/injection-tokens';
import { VmInfo } from '../../../../vmware/domain/interfaces/migration-plan-analysis.interface';
import { MigrationEvent } from '../../../../vmware/domain/interfaces/migration-orchestrator.interface';

describe('SendMigrationCompletedEmailUseCase', () => {
  let useCase: SendMigrationCompletedEmailUseCase;
  let mockMailService: jest.Mocked<IMailService>;

  const mockAdmin: User = {
    id: 'admin-id',
    username: 'admin',
    email: 'admin@example.com',
  } as User;

  const baseMigrationEvent: MigrationCompletedEvent = {
    sessionId: 'session-123',
    userId: 'user-123',
    migrationType: 'migration',
    events: [],
    affectedVms: [],
    successfulVms: [],
    failedVms: [],
  };

  beforeEach(async () => {
    mockMailService = {
      send: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendMigrationCompletedEmailUseCase,
        {
          provide: MAIL_SERVICE_TOKEN,
          useValue: mockMailService,
        },
      ],
    }).compile();

    useCase = module.get<SendMigrationCompletedEmailUseCase>(
      SendMigrationCompletedEmailUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should send email for successful migration', async () => {
      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        affectedVms: [
          {
            moid: 'vm-1',
            name: 'VM-Test-1',
            sourceServer: 'host-1',
          } as VmInfo,
        ],
        successfulVms: ['vm-1'],
        events: [
          {
            type: 'vm_migration',
            message: 'VM migrated successfully',
            timestamp: new Date().toISOString(),
            vmMoid: 'vm-1',
            sourceMoid: 'host-1',
            destinationMoid: 'host-2',
            success: true,
          } as MigrationEvent,
        ],
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0];

      expect(callArgs.to).toBeInstanceOf(EmailAddressVO);
      expect(callArgs.to.value).toBe(mockAdmin.email);
      expect(callArgs.template).toBe('migration-completed');
      expect(callArgs.subject).toContain('Migration terminée réussie');
      expect(callArgs.context.username).toBe(mockAdmin.username);
      expect(callArgs.context.totalVms).toBe(1);
      expect(callArgs.context.successfulVms).toBe(1);
      expect(callArgs.context.failedVms).toBe(0);
    });

    it('should send email for migration with errors', async () => {
      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        affectedVms: [
          {
            moid: 'vm-1',
            name: 'VM-Test-1',
            sourceServer: 'host-1',
          },
          {
            moid: 'vm-2',
            name: 'VM-Test-2',
            sourceServer: 'host-1',
          } as VmInfo,
        ],
        successfulVms: ['vm-1'],
        failedVms: ['vm-2'],
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      expect(mockMailService.send).toHaveBeenCalledTimes(1);
      const callArgs = mockMailService.send.mock.calls[0][0];

      expect(callArgs.subject).toContain('Migration terminée avec erreurs');
      expect(callArgs.context.totalVms).toBe(2);
      expect(callArgs.context.successfulVms).toBe(1);
      expect(callArgs.context.failedVms).toBe(1);
    });

    it('should handle shutdown type correctly', async () => {
      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        migrationType: 'shutdown',
        affectedVms: [
          {
            moid: 'vm-1',
            name: 'VM-Test-1',
            sourceServer: 'host-1',
          } as VmInfo,
        ],
        successfulVms: ['vm-1'],
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      const callArgs = mockMailService.send.mock.calls[0][0];
      expect(callArgs.subject).toContain('Arrêt terminé');
      expect(callArgs.context.migrationType).toBe('shutdown');
    });

    it('should handle restart type correctly', async () => {
      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        migrationType: 'restart',
        affectedVms: [
          {
            moid: 'vm-1',
            name: 'VM-Test-1',
            sourceServer: 'host-1',
          } as VmInfo,
        ],
        successfulVms: ['vm-1'],
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      const callArgs = mockMailService.send.mock.calls[0][0];
      expect(callArgs.subject).toContain('Redémarrage terminé');
      expect(callArgs.context.migrationType).toBe('restart');
    });

    it('should format VM details correctly for migration', async () => {
      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        affectedVms: [
          {
            moid: 'vm-1',
            name: 'VM-Test-1',
            sourceServer: 'host-1',
            destinationServer: 'host-2',
          } as VmInfo,
        ],
        successfulVms: ['vm-1'],
        events: [
          {
            type: 'vm_migration',
            message: 'VM migrated',
            timestamp: new Date().toISOString(),
            vmMoid: 'vm-1',
            sourceMoid: 'host-1',
            destinationMoid: 'host-2',
            success: true,
          } as MigrationEvent,
        ],
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      const callArgs = mockMailService.send.mock.calls[0][0];
      const vmDetails = callArgs.context.affectedVms[0];

      expect(vmDetails.name).toBe('VM-Test-1');
      expect(vmDetails.sourceHost).toBe('host-1');
      expect(vmDetails.targetHost).toBe('host-2');
      expect(vmDetails.status).toBe('success');
    });

    it('should filter grace period events', async () => {
      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        affectedVms: [],
        events: [
          {
            type: 'grace_period',
            message: 'Grace period started',
            timestamp: new Date().toISOString(),
            success: true,
          } as MigrationEvent,
          {
            type: 'vm_migration',
            message: 'VM migrated',
            timestamp: new Date().toISOString(),
            success: true,
          } as MigrationEvent,
          {
            type: 'vm_shutdown',
            message: 'VM shut down',
            timestamp: new Date().toISOString(),
            success: true,
          } as MigrationEvent,
        ],
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      const callArgs = mockMailService.send.mock.calls[0][0];
      const events = callArgs.context.events;

      expect(events.length).toBe(2);
      expect(
        events.find((e: any) => e.type === 'grace_period'),
      ).toBeUndefined();
    });

    it('should limit events to last 10', async () => {
      const manyEvents = Array.from(
        { length: 15 },
        (_, i) =>
          ({
            type: 'vm_migration' as const,
            message: `Event ${i + 1}`,
            timestamp: new Date().toISOString(),
            success: true,
          }) as MigrationEvent,
      );

      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        events: manyEvents,
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      const callArgs = mockMailService.send.mock.calls[0][0];
      expect(callArgs.context.events.length).toBe(10);
    });

    it('should handle VMs without migration events', async () => {
      const migrationEvent: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        affectedVms: [
          {
            moid: 'vm-1',
            name: 'VM-Test-1',
            sourceServer: 'host-1',
          } as VmInfo,
        ],
        successfulVms: ['vm-1'],
        events: [],
      };

      await useCase.execute({ admin: mockAdmin, migrationEvent });

      const callArgs = mockMailService.send.mock.calls[0][0];
      const vmDetails = callArgs.context.affectedVms[0];

      expect(vmDetails.sourceHost).toBe('host-1');
      expect(vmDetails.targetHost).toBe('N/A');
    });

    it('should include formatted completion time', async () => {
      await useCase.execute({
        admin: mockAdmin,
        migrationEvent: baseMigrationEvent,
      });

      const callArgs = mockMailService.send.mock.calls[0][0];
      expect(callArgs.context.completedAt).toBeDefined();
      expect(typeof callArgs.context.completedAt).toBe('string');
    });
  });
});
