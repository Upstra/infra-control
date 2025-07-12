import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVmMetricsUseCase } from './get-vm-metrics.use-case';
import { VmwareService } from '../../domain/services/vmware.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Repository } from 'typeorm';
import { VmwareVmMetrics } from '../../domain/interfaces/vmware-vm.interface';

describe('GetVmMetricsUseCase', () => {
  let useCase: GetVmMetricsUseCase;
  let vmwareService: jest.Mocked<VmwareService>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  const mockServer = {
    id: 'server-1',
    ip: '192.168.1.100',
    login: 'admin',
    password: 'password',
  } as Server;

  const mockVmMetrics: VmwareVmMetrics = {
    powerState: 'poweredOn',
    guestState: 'running',
    connectionState: 'connected',
    guestHeartbeatStatus: 'green',
    overallStatus: 'green',
    maxCpuUsage: 4000,
    maxMemoryUsage: 8192,
    bootTime: '2025-01-01T00:00:00Z',
    isMigrating: false,
    overallCpuUsage: 1200,
    guestMemoryUsage: 3686,
    uptimeSeconds: 864000,
    swappedMemory: 0,
    usedStorage: 53687091200,
    totalStorage: 107374182400,
  };

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
    it('should return VM metrics for a valid server and VM', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVMMetrics.mockResolvedValue(mockVmMetrics);

      const result = await useCase.execute('server-1', 'vm-123');

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getVMMetrics).toHaveBeenCalledWith(
        'vm-123',
        {
          host: '192.168.1.100',
          user: 'admin',
          password: 'password',
          port: 443,
        }
      );
      expect(result).toEqual(mockVmMetrics);
    });

    it('should throw NotFoundException if server does not exist', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute('server-1', 'vm-123')
      ).rejects.toThrow(NotFoundException);

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getVMMetrics).not.toHaveBeenCalled();
    });

    it('should handle powered off VMs', async () => {
      const poweredOffMetrics: VmwareVmMetrics = {
        ...mockVmMetrics,
        powerState: 'poweredOff',
        guestState: 'notRunning',
        overallCpuUsage: 0,
        guestMemoryUsage: 0,
        uptimeSeconds: 0,
      };

      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVMMetrics.mockResolvedValue(poweredOffMetrics);

      const result = await useCase.execute('server-1', 'vm-123');

      expect(result).toEqual(poweredOffMetrics);
      expect(result.powerState).toBe('poweredOff');
      expect(result.overallCpuUsage).toBe(0);
    });

    it('should pass correct connection parameters', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVMMetrics.mockResolvedValue(mockVmMetrics);

      await useCase.execute('server-1', 'vm-123');

      expect(vmwareService.getVMMetrics).toHaveBeenCalledWith(
        'vm-123',
        {
          host: mockServer.ip,
          user: mockServer.login,
          password: mockServer.password,
          port: 443,
        }
      );
    });

    it('should handle vmware service errors', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVMMetrics.mockRejectedValue(new Error('VMware connection failed'));

      await expect(
        useCase.execute('server-1', 'vm-123')
      ).rejects.toThrow('VMware connection failed');
    });

    it('should throw NotFoundException with correct message', async () => {
      const serverId = 'non-existent';
      serverRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute(serverId, 'vm-123')
      ).rejects.toThrow(`Server with ID ${serverId} not found`);
    });

    it('should handle VMs with missing tools', async () => {
      const noToolsMetrics: VmwareVmMetrics = {
        ...mockVmMetrics,
        guestHeartbeatStatus: 'gray',
        guestState: 'unknown',
      };

      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getVMMetrics.mockResolvedValue(noToolsMetrics);

      const result = await useCase.execute('server-1', 'vm-123');

      expect(result.guestHeartbeatStatus).toBe('gray');
      expect(result.guestState).toBe('unknown');
    });
  });
});