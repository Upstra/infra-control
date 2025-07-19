import { Test, TestingModule } from '@nestjs/testing';
import { EnrichVmsWithMetricsUseCase } from '../enrich-vms-with-metrics.use-case';
import { GetVmMetricsUseCase } from '@/modules/vmware/application/use-cases/get-vm-metrics.use-case';
import { VmResponseDto, VmMetricsDto } from '../../dto';
import { Logger } from '@nestjs/common';
import { VmwareVmMetrics } from '@/modules/vmware/domain/interfaces';

describe('EnrichVmsWithMetricsUseCase', () => {
  let useCase: EnrichVmsWithMetricsUseCase;
  let getVmMetricsUseCase: jest.Mocked<GetVmMetricsUseCase>;
  let loggerWarnSpy: jest.SpyInstance;

  const mockVm: VmResponseDto = {
    id: 'vm-123',
    name: 'Test VM',
    moid: 'vm-moid-123',
    serverId: 'server-123',
    ip: '192.168.1.100',
    guestOs: 'Ubuntu Linux',
    state: 'active',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    grace_period_on: 300,
    grace_period_off: 600,
    priority: 1,
  } as VmResponseDto;

  const mockVmWithoutMoid: VmResponseDto = {
    ...mockVm,
    id: 'vm-456',
    moid: null,
  };

  const mockVmWithoutServerId: VmResponseDto = {
    ...mockVm,
    id: 'vm-789',
    serverId: null,
  };

  const mockVmwareMetrics: VmwareVmMetrics = {
    overallCpuUsage: 45,
    guestMemoryUsage: 75,
    maxMemoryUsage: 8192,
    powerState: 'poweredOn' as any,
    guestHeartbeatStatus: 'green' as any,
    guestState: 'running' as any,
    connectionState: 'connected' as any,
    overallStatus: 'green' as any,
    maxCpuUsage: 100,
    bootTime: '2023-01-01T00:00:00Z',
    isMigrating: false,
    uptimeSeconds: 3600,
    swappedMemory: 0,
    usedStorage: 10000,
    totalStorage: 50000,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrichVmsWithMetricsUseCase,
        {
          provide: GetVmMetricsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<EnrichVmsWithMetricsUseCase>(
      EnrichVmsWithMetricsUseCase,
    );
    getVmMetricsUseCase = module.get(GetVmMetricsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerWarnSpy.mockRestore();
  });

  describe('execute', () => {
    it('should enrich VMs with metrics successfully', async () => {
      const vms = [mockVm];
      getVmMetricsUseCase.execute.mockResolvedValue(mockVmwareMetrics);

      const result = await useCase.execute(vms);

      expect(getVmMetricsUseCase.execute).toHaveBeenCalledWith(
        'server-123',
        'vm-moid-123',
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockVm,
        metrics: {
          cpuUsage: 45,
          memoryUsage: 75,
          memoryMB: 8192,
          powerState: 'poweredOn',
          guestToolsStatus: 'green',
        },
      });
    });

    it('should handle multiple VMs', async () => {
      const vms = [mockVm, mockVmWithoutMoid, mockVmWithoutServerId];
      getVmMetricsUseCase.execute.mockResolvedValue(mockVmwareMetrics);

      const result = await useCase.execute(vms);

      expect(result).toHaveLength(3);
      expect(getVmMetricsUseCase.execute).toHaveBeenCalledTimes(1);
      expect(getVmMetricsUseCase.execute).toHaveBeenCalledWith(
        'server-123',
        'vm-moid-123',
      );
    });

    it('should skip VMs without moid', async () => {
      const vms = [mockVmWithoutMoid];

      const result = await useCase.execute(vms);

      expect(getVmMetricsUseCase.execute).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockVmWithoutMoid,
        metrics: undefined,
      });
    });

    it('should skip VMs without serverId', async () => {
      const vms = [mockVmWithoutServerId];

      const result = await useCase.execute(vms);

      expect(getVmMetricsUseCase.execute).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockVmWithoutServerId,
        metrics: undefined,
      });
    });

    it('should handle metrics with null values', async () => {
      const vms = [mockVm];
      getVmMetricsUseCase.execute.mockResolvedValue({
        ...mockVmwareMetrics,
        overallCpuUsage: null,
        guestMemoryUsage: null,
        maxMemoryUsage: null,
        powerState: null,
        guestHeartbeatStatus: null,
      } as any);

      const result = await useCase.execute(vms);

      expect(result[0].metrics).toEqual({
        cpuUsage: 0,
        memoryUsage: 0,
        memoryMB: 0,
        powerState: 'unknown',
        guestToolsStatus: 'unknown',
      });
    });

    it('should handle metrics with undefined values', async () => {
      const vms = [mockVm];
      getVmMetricsUseCase.execute.mockResolvedValue({
        ...mockVmwareMetrics,
        overallCpuUsage: undefined,
        guestMemoryUsage: undefined,
        maxMemoryUsage: undefined,
        powerState: undefined,
        guestHeartbeatStatus: undefined,
      } as any);

      const result = await useCase.execute(vms);

      expect(result[0].metrics).toEqual({
        cpuUsage: 0,
        memoryUsage: 0,
        memoryMB: 0,
        powerState: 'unknown',
        guestToolsStatus: 'unknown',
      });
    });

    it('should handle errors from getVmMetricsUseCase', async () => {
      const vms = [mockVm];
      const error = new Error('VMware API error');
      getVmMetricsUseCase.execute.mockRejectedValue(error);

      const result = await useCase.execute(vms);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Failed to get metrics for VM vm-123: VMware API error',
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockVm,
        metrics: undefined,
      });
    });

    it('should handle empty VM array', async () => {
      const result = await useCase.execute([]);

      expect(result).toEqual([]);
      expect(getVmMetricsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should continue processing other VMs after error', async () => {
      const vm1 = { ...mockVm, id: 'vm-1', moid: 'moid-1' };
      const vm2 = { ...mockVm, id: 'vm-2', moid: 'moid-2' };
      const vm3 = { ...mockVm, id: 'vm-3', moid: 'moid-3' };
      const vms = [vm1, vm2, vm3];

      getVmMetricsUseCase.execute
        .mockResolvedValueOnce(mockVmwareMetrics)
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce(mockVmwareMetrics);

      const result = await useCase.execute(vms);

      expect(result).toHaveLength(3);
      expect(result[0].metrics).toBeDefined();
      expect(result[1].metrics).toBeUndefined();
      expect(result[2].metrics).toBeDefined();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Failed to get metrics for VM vm-2: API error',
      );
    });

    it('should handle partial metrics data', async () => {
      const vms = [mockVm];
      getVmMetricsUseCase.execute.mockResolvedValue({
        ...mockVmwareMetrics,
        overallCpuUsage: 50,
        guestMemoryUsage: null,
        maxMemoryUsage: 4096,
        powerState: undefined,
        guestHeartbeatStatus: 'gray' as any,
      } as any);

      const result = await useCase.execute(vms);

      expect(result[0].metrics).toEqual({
        cpuUsage: 50,
        memoryUsage: 0,
        memoryMB: 4096,
        powerState: 'unknown',
        guestToolsStatus: 'gray',
      });
    });

    it('should preserve all VM properties when enriching', async () => {
      const customVm: VmResponseDto = {
        ...mockVm,
        customField: 'custom-value',
        anotherField: 123,
      } as any;
      
      getVmMetricsUseCase.execute.mockResolvedValue(mockVmwareMetrics);

      const result = await useCase.execute([customVm]);

      expect(result[0]).toEqual({
        ...customVm,
        metrics: expect.any(Object),
      });
    });
  });
});