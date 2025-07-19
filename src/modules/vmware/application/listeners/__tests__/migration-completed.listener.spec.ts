import { Test, TestingModule } from '@nestjs/testing';
import { MigrationCompletedListener } from '../migration-completed.listener';
import { VmwareService } from '../../../domain/services/vmware.service';
import { VmwareConnectionService } from '../../../domain/services/vmware-connection.service';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { SendMigrationCompletedEmailUseCase } from '@/modules/email/application/use-cases/send-migration-completed-email.use-case';
import { MigrationCompletedEvent } from '../../../domain/interfaces/migration-completed-event.interface';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { User } from '@/modules/users/domain/entities/user.entity';
import { VmInfo } from '../../../domain/interfaces/migration-plan-analysis.interface';

describe('MigrationCompletedListener', () => {
  let listener: MigrationCompletedListener;
  let mockVmwareService: jest.Mocked<VmwareService>;
  let mockVmwareConnectionService: jest.Mocked<VmwareConnectionService>;
  let mockVmRepository: jest.Mocked<VmRepositoryInterface>;
  let mockServerRepository: jest.Mocked<ServerRepositoryInterface>;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockSendMigrationCompletedEmailUseCase: jest.Mocked<SendMigrationCompletedEmailUseCase>;

  const mockVCenterServer: Server = {
    id: 'vcenter-1',
    name: 'vCenter Server',
    type: 'vcenter',
  } as Server;

  const mockAdminUsers: User[] = [
    {
      id: 'admin-1',
      username: 'admin1',
      email: 'admin1@example.com',
    } as User,
    {
      id: 'admin-2',
      username: 'admin2',
      email: 'admin2@example.com',
    } as User,
  ];

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
    mockVmwareService = {
      listVMs: jest.fn(),
    } as any;

    mockVmwareConnectionService = {
      buildVmwareConnection: jest.fn(),
    } as any;

    mockVmRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    mockServerRepository = {
      findAll: jest.fn().mockResolvedValue([mockVCenterServer]),
    } as any;

    mockUserRepository = {
      findAdminUsers: jest.fn().mockResolvedValue(mockAdminUsers),
    } as any;

    mockSendMigrationCompletedEmailUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationCompletedListener,
        {
          provide: VmwareService,
          useValue: mockVmwareService,
        },
        {
          provide: VmwareConnectionService,
          useValue: mockVmwareConnectionService,
        },
        {
          provide: 'VmRepositoryInterface',
          useValue: mockVmRepository,
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: mockServerRepository,
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: mockUserRepository,
        },
        {
          provide: SendMigrationCompletedEmailUseCase,
          useValue: mockSendMigrationCompletedEmailUseCase,
        },
      ],
    }).compile();

    listener = module.get<MigrationCompletedListener>(
      MigrationCompletedListener,
    );
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleMigrationCompleted', () => {
    it('should skip VM updates for shutdown migration', async () => {
      const event: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        migrationType: 'shutdown',
        successfulVms: ['vm-1'],
      };

      await listener.handleMigrationCompleted(event);

      expect(mockVmwareService.listVMs).not.toHaveBeenCalled();
      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).toHaveBeenCalledTimes(2);
    });

    it('should skip VM updates when no successful VMs', async () => {
      const event: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        successfulVms: [],
      };

      await listener.handleMigrationCompleted(event);

      expect(mockVmwareService.listVMs).not.toHaveBeenCalled();
      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
    });

    it('should update VMs and send emails for successful migration', async () => {
      const mockVm: Vm = {
        id: 'vm-id-1',
        moid: 'vm-1',
        name: 'Test VM',
        esxiHostMoid: 'host-1',
      } as Vm;

      mockVmRepository.findOne.mockResolvedValue(mockVm);
      mockVmwareService.listVMs.mockResolvedValue([
        {
          moid: 'vm-1',
          name: 'Test VM',
          esxiHostMoid: 'host-2',
          esxiHostName: 'host-2',
          ip: '192.168.1.100',
          guestOs: 'linux',
          guestFamily: 'linux',
          version: 'vmx-19',
          createDate: new Date().toISOString(),
          numCoresPerSocket: 1,
          numCPU: 2,
          memoryMB: 4096,
          powerState: 'poweredOn',
        },
      ]);

      const event: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        successfulVms: ['vm-1'],
        affectedVms: [
          {
            moid: 'vm-1',
            name: 'Test VM',
            sourceServer: 'host-1',
            destinationServer: 'host-2',
          } as VmInfo,
        ],
      };

      await listener.handleMigrationCompleted(event);

      expect(mockVmwareService.listVMs).toHaveBeenCalled();
      expect(mockVmRepository.save).toHaveBeenCalledWith({
        ...mockVm,
        esxiHostMoid: 'host-2',
      });
      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).toHaveBeenCalledTimes(2);
    });

    it('should handle VM update failures gracefully', async () => {
      mockVmRepository.findOne.mockRejectedValue(new Error('DB Error'));
      mockVmwareService.listVMs.mockResolvedValue([]);

      const event: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        successfulVms: ['vm-1'],
      };

      await listener.handleMigrationCompleted(event);

      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).toHaveBeenCalledTimes(2);
    });

    it('should send emails to all admin users', async () => {
      await listener.handleMigrationCompleted(baseMigrationEvent);

      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).toHaveBeenCalledTimes(2);

      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).toHaveBeenCalledWith({
        admin: mockAdminUsers[0],
        migrationEvent: baseMigrationEvent,
      });
      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).toHaveBeenCalledWith({
        admin: mockAdminUsers[1],
        migrationEvent: baseMigrationEvent,
      });
    });

    it('should handle email sending failures gracefully', async () => {
      mockSendMigrationCompletedEmailUseCase.execute
        .mockRejectedValueOnce(new Error('Email Error'))
        .mockResolvedValueOnce(undefined);

      await listener.handleMigrationCompleted(baseMigrationEvent);

      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).toHaveBeenCalledTimes(2);
    });

    it('should handle when no admin users found', async () => {
      mockUserRepository.findAdminUsers.mockResolvedValue([]);

      await listener.handleMigrationCompleted(baseMigrationEvent);

      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it('should handle user repository errors gracefully', async () => {
      mockUserRepository.findAdminUsers.mockRejectedValue(
        new Error('DB Error'),
      );

      await listener.handleMigrationCompleted(baseMigrationEvent);

      expect(
        mockSendMigrationCompletedEmailUseCase.execute,
      ).not.toHaveBeenCalled();
    });

    it('should handle vCenter connection failures', async () => {
      mockVmwareConnectionService.buildVmwareConnection.mockImplementation(
        () => {
          throw new Error('Connection failed');
        },
      );

      const event: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        successfulVms: ['vm-1', 'vm-2'],
      };

      await listener.handleMigrationCompleted(event);

      expect(mockVmRepository.save).not.toHaveBeenCalled();
      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
    });

    it('should handle when vCenter server not found', async () => {
      mockServerRepository.findAll.mockResolvedValue([]);

      const event: MigrationCompletedEvent = {
        ...baseMigrationEvent,
        successfulVms: ['vm-1'],
      };

      await listener.handleMigrationCompleted(event);

      expect(mockVmwareService.listVMs).not.toHaveBeenCalled();
      expect(mockUserRepository.findAdminUsers).toHaveBeenCalled();
    });
  });
});
