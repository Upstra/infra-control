import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetHostMetricsUseCase } from '../get-host-metrics.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { Server } from '@/modules/servers/domain/entities/server.entity';

describe('GetHostMetricsUseCase', () => {
  let useCase: GetHostMetricsUseCase;
  let vmwareService: jest.Mocked<VmwareService>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetHostMetricsUseCase,
        {
          provide: VmwareService,
          useValue: {
            getServerMetrics: jest.fn(),
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
    const mockServer = {
      id: 'server-123',
      ip: '192.168.1.10',
      login: 'admin',
      password: 'password123',
      vmwareHostMoid: 'host-456',
    } as Server;

    const mockMetrics = {
      powerState: 'poweredOn' as const,
      overallStatus: 'green' as const,
      rebootRequired: false,
      cpuUsagePercent: 15.625,
      ramUsageMB: 32768,
      uptime: 2592000,
      boottime: '2023-11-01T12:00:00.000Z',
    };

    it('should get server metrics without force', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getServerMetrics.mockResolvedValue(mockMetrics);

      const result = await useCase.execute('server-123');

      expect(result).toEqual(mockMetrics);
      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-123' },
      });
      expect(vmwareService.getServerMetrics).toHaveBeenCalledWith(
        'host-456',
        {
          host: '192.168.1.10',
          user: 'admin',
          password: 'password123',
          port: 443,
        },
        false,
      );
    });

    it('should get server metrics with force=true', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.getServerMetrics.mockResolvedValue(mockMetrics);

      const result = await useCase.execute('server-123', true);

      expect(result).toEqual(mockMetrics);
      expect(vmwareService.getServerMetrics).toHaveBeenCalledWith(
        'host-456',
        {
          host: '192.168.1.10',
          user: 'admin',
          password: 'password123',
          port: 443,
        },
        true,
      );
    });

    it('should use default moid when vmwareHostMoid is null', async () => {
      const serverWithoutMoid = {
        ...mockServer,
        vmwareHostMoid: null,
      } as Server;
      serverRepository.findOne.mockResolvedValue(serverWithoutMoid);
      vmwareService.getServerMetrics.mockResolvedValue(mockMetrics);

      const result = await useCase.execute('server-123');

      expect(result).toEqual(mockMetrics);
      expect(vmwareService.getServerMetrics).toHaveBeenCalledWith(
        'host-default',
        expect.any(Object),
        false,
      );
    });

    it('should throw NotFoundException when server not found', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(useCase.execute('invalid-server')).rejects.toThrow(
        new NotFoundException('Server with ID invalid-server not found'),
      );

      expect(vmwareService.getServerMetrics).not.toHaveBeenCalled();
    });
  });
});
