import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetVmMetricsUseCase } from '../get-vm-metrics.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { Server } from '@/modules/servers/domain/entities/server.entity';

describe('GetVmMetricsUseCase', () => {
  let useCase: GetVmMetricsUseCase;
  let vmwareService: jest.Mocked<VmwareService>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVmMetricsUseCase,
        {
          provide: VmwareService,
          useValue: {
            getVMMetrics: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Server),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetVmMetricsUseCase>(GetVmMetricsUseCase);
    vmwareService = module.get(VmwareService);
    serverRepository = module.get(getRepositoryToken(Server));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const mockServer = {
      id: 'server-123',
      ip: '192.168.1.10',
      login: 'admin',
      password: 'password123',
    } as Server;

    const mockMetrics = {
      powerState: 'poweredOn' as const,
      guestState: 'running' as const,
      connectionState: 'connected' as const,
      guestHeartbeatStatus: 'green' as const,
      overallStatus: 'green' as const,
      maxCpuUsage: 2400,
      maxMemoryUsage: 8192,
      bootTime: '2023-01-01T00:00:00.000Z',
      isMigrating: false,
      overallCpuUsage: 1500,
      guestMemoryUsage: 4096,
      uptimeSeconds: 86400,
      swappedMemory: 0,
      usedStorage: 53687091200,
      totalStorage: 107374182400,
    };

    it('should get VM metrics without force', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVMMetrics.mockResolvedValue(mockMetrics);

      const result = await useCase.execute('server-123', 'vm-456');

      expect(result).toEqual(mockMetrics);
      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-123' },
      });
      expect(vmwareService.getVMMetrics).toHaveBeenCalledWith(
        'vm-456',
        {
          host: '192.168.1.10',
          user: 'admin',
          password: 'password123',
          port: 443,
        },
        false,
      );
    });

    it('should get VM metrics with force=true', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVMMetrics.mockResolvedValue(mockMetrics);

      const result = await useCase.execute('server-123', 'vm-456', true);

      expect(result).toEqual(mockMetrics);
      expect(vmwareService.getVMMetrics).toHaveBeenCalledWith(
        'vm-456',
        {
          host: '192.168.1.10',
          user: 'admin',
          password: 'password123',
          port: 443,
        },
        true,
      );
    });

    it('should throw NotFoundException when server not found', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute('invalid-server', 'vm-456')).rejects.toThrow(
        new NotFoundException('Server with ID invalid-server not found'),
      );

      expect(vmwareService.getVMMetrics).not.toHaveBeenCalled();
    });
  });
});