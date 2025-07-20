import { Test, TestingModule } from '@nestjs/testing';
import { VmwareSyncScheduler } from '../vmware-sync.scheduler';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SyncServerVmwareDataUseCase } from '../../use-cases/sync-server-vmware-data.use-case';
import { ServerRepositoryInterface } from '@/modules/servers/domain/interfaces/server.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';
import { EmailEventType } from '@/modules/email/domain/events/email.events';
import { Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';

describe('VmwareSyncScheduler', () => {
  let scheduler: VmwareSyncScheduler;
  let syncServerVmwareData: jest.Mocked<SyncServerVmwareDataUseCase>;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let configService: jest.Mocked<ConfigService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let loggerSpy: jest.SpyInstance;
  let loggerDebugSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  const mockServers = [
    {
      id: 'vcenter-1',
      name: 'vCenter Server 1',
      type: 'vcenter',
      ip: '192.168.1.100',
    },
    {
      id: 'esxi-1',
      name: 'ESXi Host 1',
      type: 'esxi',
      ip: '192.168.1.101',
    },
    {
      id: 'ilo-1',
      name: 'ILO Server',
      type: 'ilo',
      ip: '192.168.1.102',
    },
  ];

  const mockAdminUsers = [
    {
      id: 'user-1',
      email: 'admin1@example.com',
      isActive: true,
      roles: [{ id: 'role-1', isAdmin: true }],
    },
    {
      id: 'user-2',
      email: 'admin2@example.com',
      isActive: true,
      roles: [{ id: 'role-2', isAdmin: true }],
    },
    {
      id: 'user-3',
      email: 'user@example.com',
      isActive: true,
      roles: [{ id: 'role-3', isAdmin: false }],
    },
    {
      id: 'user-4',
      email: 'inactive@example.com',
      isActive: false,
      roles: [{ id: 'role-4', isAdmin: true }],
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VmwareSyncScheduler,
        {
          provide: SyncServerVmwareDataUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findAll: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    scheduler = module.get<VmwareSyncScheduler>(VmwareSyncScheduler);
    syncServerVmwareData = module.get(SyncServerVmwareDataUseCase);
    serverRepository = module.get('ServerRepositoryInterface');
    userRepository = module.get('UserRepositoryInterface');
    configService = module.get(ConfigService);
    eventEmitter = module.get(EventEmitter2);

    // Set isEnabled to true by default
    Object.defineProperty(scheduler, 'isEnabled', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.mockRestore();
    loggerDebugSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with sync enabled by default', () => {
      configService.get.mockReturnValue('true');
      const newScheduler = new VmwareSyncScheduler(
        syncServerVmwareData as any,
        serverRepository as any,
        userRepository as any,
        configService as any,
        eventEmitter as any,
      );
      expect(newScheduler['isEnabled']).toBe(true);
    });

    it('should initialize with sync disabled when config is false', () => {
      configService.get.mockReturnValue('false');
      const newScheduler = new VmwareSyncScheduler(
        syncServerVmwareData as any,
        serverRepository as any,
        userRepository as any,
        configService as any,
        eventEmitter as any,
      );
      expect(newScheduler['isEnabled']).toBe(false);
    });

    it('should initialize with sync disabled when config is not "true"', () => {
      configService.get.mockReturnValue('yes');
      const newScheduler = new VmwareSyncScheduler(
        syncServerVmwareData as any,
        serverRepository as any,
        userRepository as any,
        configService as any,
        eventEmitter as any,
      );
      expect(newScheduler['isEnabled']).toBe(false);
    });
  });

  describe('syncAllVmwareServers', () => {
    it('should skip sync when disabled', async () => {
      Object.defineProperty(scheduler, 'isEnabled', {
        value: false,
        writable: true,
      });

      await scheduler.syncAllVmwareServers();

      expect(loggerDebugSpy).toHaveBeenCalledWith('VMware sync is disabled');
      expect(serverRepository.findAll).not.toHaveBeenCalled();
    });

    it('should sync all VMware servers successfully', async () => {
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      serverRepository.findAll.mockResolvedValue(mockServers as any);
      syncServerVmwareData.execute.mockResolvedValue({
        vmsUpdated: 5,
        vmsCreated: 2,
        totalVms: 7,
      } as any);

      await scheduler.syncAllVmwareServers();

      expect(loggerSpy).toHaveBeenCalledWith('Starting daily VMware sync');
      expect(serverRepository.findAll).toHaveBeenCalled();
      expect(syncServerVmwareData.execute).toHaveBeenCalledTimes(2);
      expect(syncServerVmwareData.execute).toHaveBeenCalledWith({
        serverId: 'vcenter-1',
        fullSync: true,
      });
      expect(syncServerVmwareData.execute).toHaveBeenCalledWith({
        serverId: 'esxi-1',
        fullSync: true,
      });
      expect(loggerSpy).toHaveBeenCalledWith(
        'VMware sync completed in 1000ms',
        {
          totalServers: 2,
          successfulServers: 2,
          failedServers: 0,
          vmsUpdated: 10,
          errors: [],
        },
      );
    });

    it('should handle sync errors and send report', async () => {
      serverRepository.findAll.mockResolvedValue(mockServers as any);
      syncServerVmwareData.execute
        .mockResolvedValueOnce({ vmsUpdated: 3 } as any)
        .mockRejectedValueOnce(new Error('Connection failed'));
      userRepository.findAll.mockResolvedValue(mockAdminUsers as any);

      await scheduler.syncAllVmwareServers();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to sync server ESXi Host 1: Connection failed',
        expect.any(String),
      );
      expect(userRepository.findAll).toHaveBeenCalledWith(['roles']);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.VMWARE_SYNC_REPORT,
        expect.objectContaining({
          adminEmails: ['admin1@example.com', 'admin2@example.com'],
          totalServers: 2,
          successfulServers: 1,
          failedServers: 1,
          vmsUpdated: 3,
          errors: ['Failed to sync server ESXi Host 1: Connection failed'],
        }),
      );
    });

    it('should handle sync with no VMware servers', async () => {
      serverRepository.findAll.mockResolvedValue([
        { id: 'ilo-1', name: 'ILO Server', type: 'ilo' },
      ] as any);

      await scheduler.syncAllVmwareServers();

      expect(syncServerVmwareData.execute).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('VMware sync completed'),
        expect.objectContaining({
          totalServers: 0,
          successfulServers: 0,
          failedServers: 0,
          vmsUpdated: 0,
          errors: [],
        }),
      );
    });

    it('should handle general scheduler errors', async () => {
      serverRepository.findAll.mockRejectedValue(new Error('Database error'));

      await scheduler.syncAllVmwareServers();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'VMware sync scheduler failed:',
        expect.any(Error),
      );
    });

    it('should handle sync with undefined vmsUpdated', async () => {
      serverRepository.findAll.mockResolvedValue([mockServers[0]] as any);
      syncServerVmwareData.execute.mockResolvedValue({} as any);

      await scheduler.syncAllVmwareServers();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('VMware sync completed'),
        expect.objectContaining({
          vmsUpdated: 0,
        }),
      );
    });
  });

  describe('sendSyncReport', () => {
    const mockReport = {
      totalServers: 2,
      successfulServers: 1,
      failedServers: 1,
      vmsUpdated: 5,
      errors: ['Error 1', 'Error 2'],
    };

    it('should send report to admin users', async () => {
      userRepository.findAll.mockResolvedValue(mockAdminUsers as any);
      const mockDate = new Date('2024-01-01T12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      await scheduler['sendSyncReport'](mockReport, 5000);

      expect(userRepository.findAll).toHaveBeenCalledWith(['roles']);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.VMWARE_SYNC_REPORT,
        {
          adminEmails: ['admin1@example.com', 'admin2@example.com'],
          date: mockDate.toLocaleString('fr-FR'),
          duration: '5.00',
          totalServers: 2,
          successfulServers: 1,
          failedServers: 1,
          vmsUpdated: 5,
          errors: ['Error 1', 'Error 2'],
        },
      );
    });

    it('should handle no admin users found', async () => {
      userRepository.findAll.mockResolvedValue([
        { id: 'user-1', email: 'user@example.com', isActive: true, roles: [] },
      ] as any);

      await scheduler['sendSyncReport'](mockReport, 3000);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No admin users found to send sync report',
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should filter out inactive admin users', async () => {
      userRepository.findAll.mockResolvedValue([
        {
          id: 'user-1',
          email: 'inactive@example.com',
          isActive: false,
          roles: [{ isAdmin: true }],
        },
        {
          id: 'user-2',
          email: 'active@example.com',
          isActive: true,
          roles: [{ isAdmin: true }],
        },
      ] as any);

      await scheduler['sendSyncReport'](mockReport, 2000);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EmailEventType.VMWARE_SYNC_REPORT,
        expect.objectContaining({
          adminEmails: ['active@example.com'],
        }),
      );
    });

    it('should handle users without roles', async () => {
      userRepository.findAll.mockResolvedValue([
        {
          id: 'user-1',
          email: 'user@example.com',
          isActive: true,
          roles: null,
        },
      ] as any);

      await scheduler['sendSyncReport'](mockReport, 1000);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'No admin users found to send sync report',
      );
    });

    it('should handle email sending errors', async () => {
      userRepository.findAll.mockRejectedValue(new Error('Database error'));

      await scheduler['sendSyncReport'](mockReport, 1000);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send sync report email:',
        expect.any(Error),
      );
    });
  });

  describe('Cron decorator', () => {
    it('should have the correct cron expression', () => {
      const cronMetadata = Reflect.getMetadata(
        'SCHEDULE_CRON_OPTIONS',
        scheduler.syncAllVmwareServers,
      );
      expect(cronMetadata).toEqual({
        cronTime: CronExpression.EVERY_DAY_AT_3AM,
      });
    });
  });
});