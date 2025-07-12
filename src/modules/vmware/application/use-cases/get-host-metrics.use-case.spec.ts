import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetHostMetricsUseCase } from './get-host-metrics.use-case';
import { VmwareService } from '../../domain/services/vmware.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Repository } from 'typeorm';
import { VmwareHost } from '../../domain/interfaces/vmware-vm.interface';

describe('GetHostMetricsUseCase', () => {
  let useCase: GetHostMetricsUseCase;
  let vmwareService: jest.Mocked<VmwareService>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  const mockServer = {
    id: 'server-1',
    ip: '192.168.1.100',
    login: 'admin',
    password: 'password',
    vmwareHostMoid: 'host-123',
  } as Server;

  const mockHostMetrics: VmwareHost = {
    name: 'esxi-host-1',
    ip: '192.168.1.100',
    powerState: 'poweredOn',
    vCenterIp: '192.168.1.10',
    overallStatus: 'green',
    cpuCores: 24,
    ramTotal: 131072,
    rebootRequired: false,
    cpuUsageMHz: 12000,
    ramUsageMB: 65536,
    uptime: 2592000,
    boottime: '2025-01-01T00:00:00Z',
    cluster: 'Production-Cluster',
    cpuHz: 2400000000,
    numCpuCores: 12,
    numCpuThreads: 24,
    model: 'ProLiant DL380 Gen10',
    vendor: 'HPE',
    biosVendor: 'HPE',
    firewall: 'enabled',
    maxHostRunningVms: 1024,
    maxHostSupportedVcpus: 4096,
    maxMemMBPerFtVm: 131072,
    maxNumDisksSVMotion: 248,
    maxRegisteredVMs: 2048,
    maxRunningVMs: 1024,
    maxSupportedVcpus: 4096,
    maxSupportedVmMemory: 6128640,
    maxVcpusPerFtVm: 8,
    quickBootSupported: true,
    rebootSupported: true,
    shutdownSupported: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetHostMetricsUseCase,
        {
          provide: VmwareService,
          useValue: {
            getHostMetrics: jest.fn(),
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

    useCase = module.get<GetHostMetricsUseCase>(GetHostMetricsUseCase);
    vmwareService = module.get(VmwareService);
    serverRepository = module.get(getRepositoryToken(Server));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return host metrics for a valid server', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getHostMetrics.mockResolvedValue(mockHostMetrics);

      const result = await useCase.execute('server-1');

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getHostMetrics).toHaveBeenCalledWith('host-123', {
        host: '192.168.1.100',
        user: 'admin',
        password: 'password',
        port: 443,
      });
      expect(result).toEqual(mockHostMetrics);
    });

    it('should throw NotFoundException if server does not exist', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute('server-1')).rejects.toThrow(
        NotFoundException,
      );

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.getHostMetrics).not.toHaveBeenCalled();
    });

    it('should use default host moid if vmwareHostMoid is null', async () => {
      const serverWithoutMoid = {
        ...mockServer,
        vmwareHostMoid: null,
      } as Server;
      serverRepository.findOne.mockResolvedValue(serverWithoutMoid);
      vmwareService.getHostMetrics.mockResolvedValue(mockHostMetrics);

      await useCase.execute('server-1');

      expect(vmwareService.getHostMetrics).toHaveBeenCalledWith(
        'host-default',
        expect.any(Object),
      );
    });

    it('should pass correct connection parameters', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getHostMetrics.mockResolvedValue(mockHostMetrics);

      await useCase.execute('server-1');

      expect(vmwareService.getHostMetrics).toHaveBeenCalledWith('host-123', {
        host: mockServer.ip,
        user: mockServer.login,
        password: mockServer.password,
        port: 443,
      });
    });

    it('should handle vmware service errors', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getHostMetrics.mockRejectedValue(
        new Error('VMware connection failed'),
      );

      await expect(useCase.execute('server-1')).rejects.toThrow(
        'VMware connection failed',
      );
    });

    it('should throw NotFoundException with correct message', async () => {
      const serverId = 'non-existent';
      serverRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute(serverId)).rejects.toThrow(
        `Server with ID ${serverId} not found`,
      );
    });

    it('should handle different host metrics values', async () => {
      const differentMetrics: VmwareHost = {
        ...mockHostMetrics,
        cpuUsageMHz: 22800,
        ramUsageMB: 111411,
        powerState: 'standBy',
        overallStatus: 'yellow',
      };

      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getHostMetrics.mockResolvedValue(differentMetrics);

      const result = await useCase.execute('server-1');

      expect(result).toEqual(differentMetrics);
    });
  });
});
