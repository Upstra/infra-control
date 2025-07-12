import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVmMetricsUseCase } from './get-vm-metrics.use-case';
import { IVmwareService } from '../../domain/interfaces/vmware.service.interface';
import { IServerRepository } from '../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../servers/domain/entities/server.entity';
import { VmMetrics } from '../../domain/interfaces/vm-metrics.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';

describe('GetVmMetricsUseCase', () => {
  let useCase: GetVmMetricsUseCase;
  let vmwareService: jest.Mocked<IVmwareService>;
  let serverRepository: jest.Mocked<IServerRepository>;

  const mockUser = createMockUser();
  const mockServer = createMockServer({
    id: 'server-1',
  });

  const mockVmMetrics: VmMetrics = {
    vm_name: 'test-vm',
    power_state: 'PoweredOn',
    cpu_usage_percent: 35.5,
    memory_usage_percent: 45.2,
    memory_allocated_gb: 8,
    memory_used_gb: 3.6,
    storage_allocated_gb: 100,
    storage_used_gb: 50,
    guest_os: 'Ubuntu 22.04',
    ip_address: '192.168.1.100',
    tools_status: 'toolsOk',
    host_name: 'esxi-host-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVmMetricsUseCase,
        {
          provide: 'IVmwareService',
          useValue: {
            getVmMetrics: jest.fn(),
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

    useCase = module.get<GetVmMetricsUseCase>(GetVmMetricsUseCase);
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

    it('should return VM metrics successfully', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVmMetrics.mockResolvedValue(mockVmMetrics);

      const result = await useCase.execute({
        serverId: 'server-1',
        vmName,
        user: mockUser,
      });

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getVmMetrics).toHaveBeenCalledWith(
        mockServer,
        vmName,
        mockUser,
      );
      expect(result).toEqual(mockVmMetrics);
    });

    it('should throw NotFoundException when server is not found', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          vmName,
          user: mockUser,
        }),
      ).rejects.toThrow(new NotFoundException('Server not found'));

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getVmMetrics).not.toHaveBeenCalled();
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
        vmwareService.getVmMetrics.mockResolvedValue({
          ...mockVmMetrics,
          vm_name: vmName,
        });

        const result = await useCase.execute({
          serverId: 'server-1',
          vmName,
          user: mockUser,
        });

        expect(vmwareService.getVmMetrics).toHaveBeenCalledWith(
          mockServer,
          vmName,
          mockUser,
        );
        expect(result.vm_name).toBe(vmName);
      }
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('VM not found in vCenter');
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVmMetrics.mockRejectedValue(serviceError);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          vmName,
          user: mockUser,
        }),
      ).rejects.toThrow(serviceError);

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getVmMetrics).toHaveBeenCalledWith(
        mockServer,
        vmName,
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
          user: mockUser,
        }),
      ).rejects.toThrow(repoError);

      expect(vmwareService.getVmMetrics).not.toHaveBeenCalled();
    });

    it('should work with different server IDs', async () => {
      const testServerIds = ['server-1', 'server-42', 'server-999'];

      for (const serverId of testServerIds) {
        serverRepository.findOne.mockResolvedValue(
          createMockServer({ id: serverId }),
        );
        vmwareService.getVmMetrics.mockResolvedValue(mockVmMetrics);

        await useCase.execute({
          serverId,
          vmName,
          user: mockUser,
        });

        expect(serverRepository.findOne).toHaveBeenCalledWith({
          where: { id: serverId },
        });
      }
    });

    it('should pass through complete VM metrics', async () => {
      const completeVmMetrics: VmMetrics = {
        vm_name: 'complete-vm',
        power_state: 'PoweredOff',
        cpu_usage_percent: 0,
        memory_usage_percent: 0,
        memory_allocated_gb: 16,
        memory_used_gb: 0,
        storage_allocated_gb: 500,
        storage_used_gb: 250,
        guest_os: 'Windows Server 2019',
        ip_address: '10.0.0.50',
        tools_status: 'toolsNotRunning',
        host_name: 'esxi-host-2',
      };

      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVmMetrics.mockResolvedValue(completeVmMetrics);

      const result = await useCase.execute({
        serverId: 'server-1',
        vmName: 'complete-vm',
        user: mockUser,
      });

      expect(result).toEqual(completeVmMetrics);
      expect(result.power_state).toBe('PoweredOff');
      expect(result.cpu_usage_percent).toBe(0);
    });
  });
});