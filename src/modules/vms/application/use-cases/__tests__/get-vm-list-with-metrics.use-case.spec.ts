import { GetVmListWithMetricsUseCase } from '../get-vm-list-with-metrics.use-case';
import { GetVmListUseCase } from '../get-vm-list.use-case';
import { EnrichVmsWithMetricsUseCase } from '../enrich-vms-with-metrics.use-case';
import { VmResponseDto } from '../../dto';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';

describe('GetVmListWithMetricsUseCase', () => {
  let getVmListUseCase: jest.Mocked<GetVmListUseCase>;
  let enrichVmsWithMetricsUseCase: jest.Mocked<EnrichVmsWithMetricsUseCase>;
  let useCase: GetVmListWithMetricsUseCase;

  beforeEach(() => {
    getVmListUseCase = {
      execute: jest.fn(),
    } as any;

    enrichVmsWithMetricsUseCase = {
      execute: jest.fn(),
    } as any;

    useCase = new GetVmListWithMetricsUseCase(
      getVmListUseCase,
      enrichVmsWithMetricsUseCase,
    );
  });

  it('should return VMs without metrics when includeMetrics is false', async () => {
    const mockVm = createMockVm({ id: 'vm-1' });
    const mockResponse = {
      items: [new VmResponseDto(mockVm)],
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
    };

    getVmListUseCase.execute.mockResolvedValue(mockResponse);

    const result = await useCase.execute(1, 10, false);

    expect(getVmListUseCase.execute).toHaveBeenCalledWith(1, 10, undefined);
    expect(enrichVmsWithMetricsUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });

  it('should enrich VMs with metrics when includeMetrics is true', async () => {
    const mockVm = createMockVm({ id: 'vm-1' });
    const mockVmDto = new VmResponseDto(mockVm);
    const mockResponse = {
      items: [mockVmDto],
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
    };
    const enrichedVm = {
      ...mockVmDto,
      metrics: {
        cpuUsage: 50,
        memoryUsage: 2048,
        memoryMB: 4096,
        powerState: 'poweredOn',
      },
    };

    getVmListUseCase.execute.mockResolvedValue(mockResponse);
    enrichVmsWithMetricsUseCase.execute.mockResolvedValue([enrichedVm]);

    const result = await useCase.execute(1, 10, true);

    expect(getVmListUseCase.execute).toHaveBeenCalledWith(1, 10, undefined);
    expect(enrichVmsWithMetricsUseCase.execute).toHaveBeenCalledWith([
      mockVmDto,
    ]);
    expect(result.items[0]).toEqual(enrichedVm);
  });

  it('should not enrich when items list is empty', async () => {
    const mockResponse = {
      items: [],
      totalItems: 0,
      currentPage: 1,
      totalPages: 0,
    };

    getVmListUseCase.execute.mockResolvedValue(mockResponse);

    const result = await useCase.execute(1, 10, true);

    expect(enrichVmsWithMetricsUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });

  it('should pass serverId to getVmListUseCase', async () => {
    const serverId = 'server-123';
    const mockVm = createMockVm({ id: 'vm-1', serverId });
    const mockResponse = {
      items: [new VmResponseDto(mockVm)],
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
    };

    getVmListUseCase.execute.mockResolvedValue(mockResponse);

    const result = await useCase.execute(1, 10, false, serverId);

    expect(getVmListUseCase.execute).toHaveBeenCalledWith(1, 10, serverId);
    expect(result).toEqual(mockResponse);
  });
});
