import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';
import { VmResponseDto } from '../vm.response.dto';
import { VmListResponseDto } from '../vm.list.response.dto';

describe('VmListResponseDto', () => {
  it('should set properties correctly', () => {
    const items = [new VmResponseDto(createMockVm())];
    const dto = new VmListResponseDto(items, 5, 1, 2);
    expect(dto.items).toEqual(items);
    expect(dto.totalItems).toBe(5);
    expect(dto.currentPage).toBe(1);
    expect(dto.totalPages).toBe(3);
  });

  it('should support empty list', () => {
    const dto = new VmListResponseDto([], 0, 1, 10);
    expect(dto.items).toEqual([]);
    expect(dto.totalItems).toBe(0);
    expect(dto.totalPages).toBe(0);
  });
});
