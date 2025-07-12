import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MigrateVmUseCase } from './migrate-vm.use-case';
import { IVmwareService } from '../../domain/interfaces/vmware.service.interface';
import { IServerRepository } from '../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../servers/domain/entities/server.entity';
import { User } from '../../../users/domain/entities/user.entity';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';

describe('MigrateVmUseCase', () => {
  let useCase: MigrateVmUseCase;
  let vmwareService: jest.Mocked<IVmwareService>;
  let serverRepository: jest.Mocked<IServerRepository>;

  const mockUser = createMockUser();
  const mockServer = createMockServer({
    id: 'server-1',
  });

  const mockMigrationResult = {
    success: true,
    message: 'VM migration initiated successfully',
    taskId: 'task-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrateVmUseCase,
        {
          provide: 'IVmwareService',
          useValue: {
            migrateVm: jest.fn(),
          },
        },
        {
          provide: 'IServerRepository',
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<MigrateVmUseCase>(MigrateVmUseCase);
    vmwareService = module.get('IVmwareService');
    serverRepository = module.get('IServerRepository');
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    it('should have dependencies injected', () => {
      expect(vmwareService).toBeDefined();
      expect(serverRepository).toBeDefined();
    });
  });

  describe('execute', () => {
    const vmName = 'test-vm';
    const targetHost = 'target-host-123';

    it('should migrate VM successfully', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVm.mockResolvedValue(mockMigrationResult);

      const result = await useCase.execute({
        serverId: 'server-1',
        vmName,
        targetHost,
        user: mockUser,
      });

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.migrateVm).toHaveBeenCalledWith(
        mockServer,
        vmName,
        targetHost,
        mockUser,
      );
      expect(result).toEqual(mockMigrationResult);
    });

    it('should throw NotFoundException when server is not found', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          vmName,
          targetHost,
          user: mockUser,
        }),
      ).rejects.toThrow(new NotFoundException('Server not found'));

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.migrateVm).not.toHaveBeenCalled();
    });

    it('should handle different VM names', async () => {
      const testVmNames = [
        'simple-vm',
        'vm-with-numbers-123',
        'VM_WITH_UNDERSCORES',
        'vm.with.dots',
        'vm-with-very-long-name-that-might-be-common',
      ];

      for (const vmName of testVmNames) {
        serverRepository.findOne.mockResolvedValue(mockServer);
        vmwareService.migrateVm.mockResolvedValue(mockMigrationResult);

        await useCase.execute({
          serverId: 'server-1',
          vmName,
          targetHost,
          user: mockUser,
        });

        expect(vmwareService.migrateVm).toHaveBeenCalledWith(
          mockServer,
          vmName,
          targetHost,
          mockUser,
        );
      }
    });

    it('should handle different target hosts', async () => {
      const testTargetHosts = [
        'host-1',
        'domain-c123.host-456',
        'esxi-host.example.com',
        'host_with_underscores',
      ];

      for (const targetHost of testTargetHosts) {
        serverRepository.findOne.mockResolvedValue(mockServer);
        vmwareService.migrateVm.mockResolvedValue(mockMigrationResult);

        await useCase.execute({
          serverId: 'server-1',
          vmName,
          targetHost,
          user: mockUser,
        });

        expect(vmwareService.migrateVm).toHaveBeenCalledWith(
          mockServer,
          vmName,
          targetHost,
          mockUser,
        );
      }
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Migration failed: Target host not available');
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVm.mockRejectedValue(serviceError);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          vmName,
          targetHost,
          user: mockUser,
        }),
      ).rejects.toThrow(serviceError);

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.migrateVm).toHaveBeenCalledWith(
        mockServer,
        vmName,
        targetHost,
        mockUser,
      );
    });

    it('should handle repository errors', async () => {
      const repoError = new Error('Database connection failed');
      serverRepository.findOne.mockRejectedValue(repoError);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          vmName,
          targetHost,
          user: mockUser,
        }),
      ).rejects.toThrow(repoError);

      expect(vmwareService.migrateVm).not.toHaveBeenCalled();
    });

    it('should work with different server IDs', async () => {
      const testServerIds = ['server-1', 'server-42', 'server-999'];

      for (const serverId of testServerIds) {
        serverRepository.findOne.mockResolvedValue(
          createMockServer({ id: serverId }),
        );
        vmwareService.migrateVm.mockResolvedValue(mockMigrationResult);

        await useCase.execute({
          serverId,
          vmName,
          targetHost,
          user: mockUser,
        });

        expect(serverRepository.findOne).toHaveBeenCalledWith({
          where: { id: serverId },
        });
      }
    });

    it('should handle different migration results', async () => {
      const testResults = [
        {
          success: true,
          message: 'Migration completed',
          taskId: 'task-abc',
        },
        {
          success: false,
          message: 'Migration queued',
          taskId: 'task-xyz',
        },
        {
          success: true,
          message: 'VM already on target host',
          taskId: null,
        },
      ];

      for (const expectedResult of testResults) {
        serverRepository.findOne.mockResolvedValue(mockServer);
        vmwareService.migrateVm.mockResolvedValue(expectedResult);

        const result = await useCase.execute({
          serverId: 'server-1',
          vmName,
          targetHost,
          user: mockUser,
        });

        expect(result).toEqual(expectedResult);
      }
    });
  });
});