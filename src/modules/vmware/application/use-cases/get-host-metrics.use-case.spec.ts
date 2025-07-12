import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetHostMetricsUseCase } from './get-host-metrics.use-case';
import { IVmwareService } from '../../domain/interfaces/vmware.service.interface';
import { IServerRepository } from '../../../servers/domain/interfaces/server.repository.interface';
import { Server } from '../../../servers/domain/entities/server.entity';
import { HostMetrics } from '../../domain/interfaces/host-metrics.interface';
import { User } from '../../../users/domain/entities/user.entity';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';

describe('GetHostMetricsUseCase', () => {
  let useCase: GetHostMetricsUseCase;
  let vmwareService: jest.Mocked<IVmwareService>;
  let serverRepository: jest.Mocked<IServerRepository>;

  const mockUser = createMockUser();
  const mockServer = createMockServer({
    id: 'server-1',
    vmwareHostMoid: 'host-123',
  });

  const mockHostMetrics: HostMetrics = {
    host_name: 'esxi-host-1',
    cpu_usage_percent: 45.5,
    memory_usage_percent: 62.3,
    memory_total_gb: 128,
    memory_used_gb: 79.7,
    storage_total_gb: 2048,
    storage_used_gb: 1024,
    vm_count: 15,
    power_state: 'PoweredOn',
    connection_state: 'connected',
    uptime_days: 30,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetHostMetricsUseCase,
        {
          provide: 'IVmwareService',
          useValue: {
            getHostMetrics: jest.fn(),
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

    useCase = module.get<GetHostMetricsUseCase>(GetHostMetricsUseCase);
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
    it('should return host metrics successfully', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getHostMetrics.mockResolvedValue(mockHostMetrics);

      const result = await useCase.execute({
        serverId: 'server-1',
        user: mockUser,
      });

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getHostMetrics).toHaveBeenCalledWith(
        mockServer,
        'host-123',
        mockUser,
      );
      expect(result).toEqual(mockHostMetrics);
    });

    it('should throw NotFoundException when server is not found', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          user: mockUser,
        }),
      ).rejects.toThrow(new NotFoundException('Server not found'));

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getHostMetrics).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when server has no vmwareHostMoid', async () => {
      const serverWithoutMoid = { ...mockServer, vmwareHostMoid: null };
      serverRepository.findOne.mockResolvedValue(serverWithoutMoid);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          user: mockUser,
        }),
      ).rejects.toThrow(
        new NotFoundException('Server is not configured as a VMware host'),
      );

      expect(vmwareService.getHostMetrics).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when server has undefined vmwareHostMoid', async () => {
      const serverWithUndefinedMoid = { ...mockServer, vmwareHostMoid: undefined };
      serverRepository.findOne.mockResolvedValue(serverWithUndefinedMoid);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          user: mockUser,
        }),
      ).rejects.toThrow(
        new NotFoundException('Server is not configured as a VMware host'),
      );

      expect(vmwareService.getHostMetrics).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when server has empty string vmwareHostMoid', async () => {
      const serverWithEmptyMoid = { ...mockServer, vmwareHostMoid: '' };
      serverRepository.findOne.mockResolvedValue(serverWithEmptyMoid);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          user: mockUser,
        }),
      ).rejects.toThrow(
        new NotFoundException('Server is not configured as a VMware host'),
      );

      expect(vmwareService.getHostMetrics).not.toHaveBeenCalled();
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('VMware API connection failed');
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getHostMetrics.mockRejectedValue(serviceError);

      await expect(
        useCase.execute({
          serverId: 'server-1',
          user: mockUser,
        }),
      ).rejects.toThrow(serviceError);
    });

    it('should handle different server IDs', async () => {
      const testCases = ['server-1', 'server-100', 'server-999'];

      for (const serverId of testCases) {
        serverRepository.findOne.mockResolvedValue(createMockServer({ id: serverId, vmwareHostMoid: 'host-123' }));
        vmwareService.getHostMetrics.mockResolvedValue(mockHostMetrics);

        await useCase.execute({ serverId, user: mockUser });

        expect(serverRepository.findOne).toHaveBeenCalledWith({
          where: { id: serverId },
        });
      }
    });

    it('should handle different host MOIDs', async () => {
      const testMoids = ['host-1', 'host-abc-123', 'domain-c123.host-456'];

      for (const moid of testMoids) {
        const serverWithMoid = { ...mockServer, vmwareHostMoid: moid };
        serverRepository.findOne.mockResolvedValue(serverWithMoid);
        vmwareService.getHostMetrics.mockResolvedValue(mockHostMetrics);

        await useCase.execute({ serverId: 1, user: mockUser });

        expect(vmwareService.getHostMetrics).toHaveBeenCalledWith(
          serverWithMoid,
          moid,
          mockUser,
        );
      }
    });
  });
});