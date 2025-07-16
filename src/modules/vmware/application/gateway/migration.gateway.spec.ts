import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MigrationGateway } from './migration.gateway';
import { MigrationOrchestratorService } from '../../domain/services/migration-orchestrator.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import { JwtNotValid } from '@/modules/auth/domain/exceptions/auth.exception';
import { MigrationState } from '../../domain/interfaces/migration-orchestrator.interface';

describe('MigrationGateway', () => {
  let gateway: MigrationGateway;
  let migrationOrchestrator: jest.Mocked<MigrationOrchestratorService>;
  let jwtService: jest.Mocked<JwtService>;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;
  let mockSocket: any;

  beforeEach(async () => {
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
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            executeStructured: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<MigrationGateway>(MigrationGateway);
    migrationOrchestrator = module.get(MigrationOrchestratorService);
    jwtService = module.get(JwtService);
    logHistoryUseCase = module.get(LogHistoryUseCase);

    gateway.server = {
      emit: jest.fn(),
    } as any;

    mockSocket = {
      id: 'socket-123',
      emit: jest.fn(),
      disconnect: jest.fn(),
      handshake: {
        auth: {
          token: 'valid-token',
        },
        address: '192.168.1.1',
        headers: {
          'user-agent': 'test-agent',
        },
      },
    };
  });

  describe('handleConnection', () => {
    it('should handle valid connection and emit status', async () => {
      jwtService.verify.mockReturnValue({ userId: 'user-123' });
      migrationOrchestrator.getMigrationStatus.mockResolvedValue({
        state: MigrationState.IDLE,
        events: [],
      });

      await gateway.handleConnection(mockSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(migrationOrchestrator.getMigrationStatus).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('migration:status', {
        state: MigrationState.IDLE,
        events: [],
      });
    });

    it('should handle invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('auth:refresh');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle missing token', async () => {
      mockSocket.handshake.auth = {};

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('auth:refresh');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up on disconnect', () => {
      gateway['connectedClients'].set('socket-123', mockSocket);
      gateway['userSessions'].set('socket-123', 'user-123');

      gateway.handleDisconnect(mockSocket);

      expect(gateway['connectedClients'].has('socket-123')).toBe(false);
      expect(gateway['userSessions'].has('socket-123')).toBe(false);
    });
  });

  describe('handleStartMigration', () => {
    beforeEach(() => {
      gateway['userSessions'].set('socket-123', 'user-123');
    });

    it('should start migration successfully', async () => {
      migrationOrchestrator.executeMigrationPlan.mockResolvedValue();
      logHistoryUseCase.executeStructured.mockResolvedValue();

      await gateway.handleStartMigration(mockSocket, { planPath: '/path/to/plan.yaml' });

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'migration',
        entityId: 'socket-123',
        action: 'START_MIGRATION',
        userId: 'user-123',
        metadata: {
          planPath: '/path/to/plan.yaml',
          migrationType: 'unknown',
        },
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
      });

      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalledWith(
        '/path/to/plan.yaml',
        'user-123',
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
          correlationId: 'socket-123',
        }),
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('migration:started', { success: true });
    });

    it('should handle migration error', async () => {
      migrationOrchestrator.executeMigrationPlan.mockRejectedValue(new Error('Migration failed'));

      await gateway.handleStartMigration(mockSocket, { planPath: '/path/to/plan.yaml' });

      expect(mockSocket.emit).toHaveBeenCalledWith('migration:error', {
        message: 'Migration failed',
      });
    });

    it('should handle unauthorized access', async () => {
      gateway['userSessions'].clear();

      await gateway.handleStartMigration(mockSocket, { planPath: '/path/to/plan.yaml' });

      expect(mockSocket.emit).toHaveBeenCalledWith('migration:error', {
        message: 'JwtNotValid',
      });
    });

    it('should handle logging failure gracefully', async () => {
      logHistoryUseCase.executeStructured.mockRejectedValue(new Error('Logging failed'));
      migrationOrchestrator.executeMigrationPlan.mockResolvedValue();

      await gateway.handleStartMigration(mockSocket, { planPath: '/path/to/plan.yaml' });

      expect(migrationOrchestrator.executeMigrationPlan).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('migration:started', { success: true });
    });
  });

  describe('handleRestartMigration', () => {
    beforeEach(() => {
      gateway['userSessions'].set('socket-123', 'user-123');
    });

    it('should restart migration successfully', async () => {
      migrationOrchestrator.executeRestartPlan.mockResolvedValue();
      logHistoryUseCase.executeStructured.mockResolvedValue();

      await gateway.handleRestartMigration(mockSocket);

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'migration',
        entityId: 'socket-123',
        action: 'START_RESTART',
        userId: 'user-123',
        metadata: {
          migrationType: 'restart',
        },
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
      });

      expect(migrationOrchestrator.executeRestartPlan).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
          correlationId: 'socket-123',
        }),
      );

      expect(mockSocket.emit).toHaveBeenCalledWith('migration:restarted', { success: true });
    });
  });

  describe('handleCancelMigration', () => {
    beforeEach(() => {
      gateway['userSessions'].set('socket-123', 'user-123');
    });

    it('should cancel migration successfully', async () => {
      migrationOrchestrator.cancelMigration.mockResolvedValue();
      logHistoryUseCase.executeStructured.mockResolvedValue();

      await gateway.handleCancelMigration(mockSocket);

      expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
        entity: 'migration',
        entityId: 'socket-123',
        action: 'CANCEL_MIGRATION',
        userId: 'user-123',
        metadata: {},
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
      });

      expect(migrationOrchestrator.cancelMigration).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('migration:cancelled', { success: true });
    });
  });

  describe('extractUserIdFromToken', () => {
    it('should extract userId from valid token', () => {
      jwtService.verify.mockReturnValue({ userId: 'user-123' });

      const userId = gateway['extractUserIdFromToken'](mockSocket);

      expect(userId).toBe('user-123');
    });

    it('should throw JwtNotValid for invalid token', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => gateway['extractUserIdFromToken'](mockSocket)).toThrow(JwtNotValid);
    });

    it('should throw JwtNotValid for missing token', () => {
      mockSocket.handshake.auth = {};

      expect(() => gateway['extractUserIdFromToken'](mockSocket)).toThrow(JwtNotValid);
    });
  });

  describe('WebSocket events', () => {
    it('should handle state change events', () => {
      gateway.handleStateChange({ state: MigrationState.IN_MIGRATION });

      expect(gateway.server.emit).toHaveBeenCalledWith('migration:stateChange', {
        state: MigrationState.IN_MIGRATION,
      });
    });

    it('should handle migration events', () => {
      const event = {
        type: 'vm_migration' as const,
        timestamp: '2023-01-01T00:00:00Z',
        success: true,
        vmName: 'test-vm',
      };

      gateway.handleMigrationEvent(event);

      expect(gateway.server.emit).toHaveBeenCalledWith('migration:event', event);
    });

    it('should handle operation change events', () => {
      gateway.handleOperationChange({ operation: 'Shutting down VMs' });

      expect(gateway.server.emit).toHaveBeenCalledWith('migration:operationChange', {
        operation: 'Shutting down VMs',
      });
    });
  });
});