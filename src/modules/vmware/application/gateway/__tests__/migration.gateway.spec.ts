import { Test, TestingModule } from '@nestjs/testing';
import { MigrationGateway } from '../migration.gateway';
import { MigrationOrchestratorService } from '../../../domain/services/migration-orchestrator.service';
import { Server, Socket } from 'socket.io';
import {
  MigrationState,
  MigrationStatus,
  MigrationEvent,
} from '../../../domain/interfaces/migration-orchestrator.interface';

describe('MigrationGateway', () => {
  let gateway: MigrationGateway;
  let migrationOrchestrator: jest.Mocked<MigrationOrchestratorService>;
  let mockServer: jest.Mocked<Server>;
  let mockClient: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
    } as any;

    mockClient = {
      id: 'test-client-id',
      emit: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationGateway,
        {
          provide: MigrationOrchestratorService,
          useValue: {
            getMigrationStatus: jest.fn(),
            executeMigrationPlan: jest.fn(),
            executeRestartPlan: jest.fn(),
            cancelMigration: jest.fn(),
            clearMigrationData: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<MigrationGateway>(MigrationGateway);
    migrationOrchestrator = module.get(MigrationOrchestratorService);

    gateway.server = mockServer;
  });

  describe('handleConnection', () => {
    it('should handle client connection and send initial status', async () => {
      const mockStatus: MigrationStatus = {
        state: MigrationState.IDLE,
        events: [],
      };
      migrationOrchestrator.getMigrationStatus.mockResolvedValue(mockStatus);

      await gateway.handleConnection(mockClient);

      expect(migrationOrchestrator.getMigrationStatus).toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith(
        'migration:status',
        mockStatus,
      );
    });

    it('should store connected client', async () => {
      migrationOrchestrator.getMigrationStatus.mockResolvedValue({
        state: MigrationState.IDLE,
        events: [],
      });

      await gateway.handleConnection(mockClient);

      expect(gateway['connectedClients'].has(mockClient.id)).toBe(true);
      expect(gateway['connectedClients'].get(mockClient.id)).toBe(mockClient);
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection', async () => {
      migrationOrchestrator.getMigrationStatus.mockResolvedValue({
        state: MigrationState.IDLE,
        events: [],
      });
      await gateway.handleConnection(mockClient);

      gateway.handleDisconnect(mockClient);

      expect(gateway['connectedClients'].has(mockClient.id)).toBe(false);
    });

    it('should handle disconnection of non-existent client', () => {
      expect(() => gateway.handleDisconnect(mockClient)).not.toThrow();
    });
  });

  describe('handleGetStatus', () => {
    it('should return current migration status', async () => {
      const mockStatus: MigrationStatus = {
        state: MigrationState.IN_MIGRATION,
        events: [
          {
            type: 'vm_migration',
            timestamp: '2023-01-01T00:00:00.000Z',
            success: true,
          },
        ],
        currentOperation: 'Migrating VMs',
      };
      migrationOrchestrator.getMigrationStatus.mockResolvedValue(mockStatus);

      await gateway.handleGetStatus(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'migration:status',
        mockStatus,
      );
    });
  });

  describe('handleStartMigration', () => {
    it('should start migration successfully', async () => {
      const planPath = '/path/to/plan.yml';
      migrationOrchestrator.executeMigrationPlan.mockResolvedValue(undefined);

      await gateway.handleStartMigration(mockClient, { planPath });

      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledWith(
        planPath,
      );
      expect(mockClient.emit).toHaveBeenCalledWith('migration:started', {
        success: true,
      });
    });

    it('should handle migration start error', async () => {
      const planPath = '/path/to/plan.yml';
      const error = new Error('Plan not found');
      migrationOrchestrator.executeMigrationPlan.mockRejectedValue(error);

      await gateway.handleStartMigration(mockClient, { planPath });

      expect(mockClient.emit).toHaveBeenCalledWith('migration:error', {
        message: 'Plan not found',
      });
    });
  });

  describe('handleRestartMigration', () => {
    it('should restart migration successfully', async () => {
      migrationOrchestrator.executeRestartPlan.mockResolvedValue(undefined);

      await gateway.handleRestartMigration(mockClient);

      expect(migrationOrchestrator.executeRestartPlan).toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('migration:restarted', {
        success: true,
      });
    });

    it('should handle restart error', async () => {
      const error = new Error('Invalid state');
      migrationOrchestrator.executeRestartPlan.mockRejectedValue(error);

      await gateway.handleRestartMigration(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('migration:error', {
        message: 'Invalid state',
      });
    });
  });

  describe('handleCancelMigration', () => {
    it('should cancel migration successfully', async () => {
      migrationOrchestrator.cancelMigration.mockResolvedValue(undefined);

      await gateway.handleCancelMigration(mockClient);

      expect(migrationOrchestrator.cancelMigration).toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('migration:cancelled', {
        success: true,
      });
    });

    it('should handle cancel error', async () => {
      const error = new Error('No active migration');
      migrationOrchestrator.cancelMigration.mockRejectedValue(error);

      await gateway.handleCancelMigration(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('migration:error', {
        message: 'No active migration',
      });
    });
  });

  describe('Event handlers', () => {
    it('should handle state change event', () => {
      const stateData = { state: MigrationState.IN_MIGRATION };

      gateway.handleStateChange(stateData);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'migration:stateChange',
        stateData,
      );
    });

    it('should handle migration event', () => {
      const event: MigrationEvent = {
        type: 'vm_migration',
        timestamp: '2023-01-01T00:00:00.000Z',
        vmName: 'test-vm',
        success: true,
      };

      gateway.handleMigrationEvent(event);

      expect(mockServer.emit).toHaveBeenCalledWith('migration:event', event);
    });

    it('should handle operation change event', () => {
      const operationData = { operation: 'Migrating VM test-vm' };

      gateway.handleOperationChange(operationData);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'migration:operationChange',
        operationData,
      );
    });
  });

  describe('Multiple clients', () => {
    it('should handle multiple client connections', async () => {
      const mockClient2 = {
        id: 'test-client-id-2',
        emit: jest.fn(),
      } as any;

      migrationOrchestrator.getMigrationStatus.mockResolvedValue({
        state: MigrationState.IDLE,
        events: [],
      });

      await gateway.handleConnection(mockClient);
      await gateway.handleConnection(mockClient2);

      expect(gateway['connectedClients'].size).toBe(2);
      expect(mockClient.emit).toHaveBeenCalled();
      expect(mockClient2.emit).toHaveBeenCalled();
    });

    it('should broadcast events to all connected clients', () => {
      const stateData = { state: MigrationState.MIGRATED };

      gateway.handleStateChange(stateData);

      expect(mockServer.emit).toHaveBeenCalledWith(
        'migration:stateChange',
        stateData,
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined in event data', () => {
      const event: MigrationEvent = {
        type: 'vm_migration',
        timestamp: '2023-01-01T00:00:00.000Z',
        vmName: undefined,
        success: true,
      };

      expect(() => gateway.handleMigrationEvent(event)).not.toThrow();
      expect(mockServer.emit).toHaveBeenCalledWith('migration:event', event);
    });

    it('should handle empty plan path', async () => {
      migrationOrchestrator.executeMigrationPlan.mockResolvedValue(undefined);

      await gateway.handleStartMigration(mockClient, { planPath: '' });

      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledWith(
        '',
      );
    });

    it('should handle reconnection of same client', async () => {
      migrationOrchestrator.getMigrationStatus.mockResolvedValue({
        state: MigrationState.IDLE,
        events: [],
      });

      await gateway.handleConnection(mockClient);
      await gateway.handleConnection(mockClient);

      expect(gateway['connectedClients'].size).toBe(1);
    });
  });
});
