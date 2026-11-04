import { GetVmListWithMetricsUseCase } from '../get-vm-list-with-metrics.use-case';
import { VmResponseDto } from '../../dto';
import { createMockVmResponseDto } from '@/modules/vms/__mocks__/vms.mock';

describe('GetVmListWithMetricsUseCase', () => {
  const getVmList = { execute: jest.fn() };
  const enrich = { execute: jest.fn() };
  const getAll = { execute: jest.fn() };
  const useCase = new GetVmListWithMetricsUseCase(
    getVmList as any,
    enrich as any,
    getAll as any,
  );
  const page = (items: VmResponseDto[]) => ({
    items,
    totalItems: items.length,
    currentPage: 1,
    totalPages: 1,
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns the plain page without metrics', async () => {
    getVmList.execute.mockResolvedValue(page([createMockVmResponseDto()]));

    await useCase.execute(1, 10, false, 'server-1');

    expect(getVmList.execute).toHaveBeenCalledWith(1, 10, 'server-1');
    expect(enrich.execute).not.toHaveBeenCalled();
  });

  it('enriches the page with metrics when asked', async () => {
    const vms = [createMockVmResponseDto()];
    getVmList.execute.mockResolvedValue(page(vms));
    enrich.execute.mockResolvedValue([{ ...vms[0], health: 'up' }]);

    const result = await useCase.execute(1, 10, true);

    expect(result.items[0].health).toBe('up');
  });

  it('lists issues only, sorted down, unknown then degraded', async () => {
    const vm = (id: string, name: string) =>
      createMockVmResponseDto({ id, name });
    getAll.execute.mockResolvedValue([
      vm('1', 'a'),
      vm('2', 'b'),
      vm('3', 'c'),
      vm('4', 'd'),
    ]);
    enrich.execute.mockImplementation(async (items: VmResponseDto[]) =>
      items.map((item, index) => ({
        ...item,
        health: ['degraded', 'up', 'down', 'unknown'][index],
      })),
    );

    const result = await useCase.execute(1, 10, true, undefined, 'issues');

    expect(result.items.map((item) => item.health)).toEqual([
      'down',
      'unknown',
      'degraded',
    ]);
    expect(result.totalItems).toBe(3);
    expect(getVmList.execute).not.toHaveBeenCalled();
  });
});
