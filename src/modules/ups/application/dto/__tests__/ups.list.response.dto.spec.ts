import { createMockUps } from '@/modules/ups/__mocks__/ups.mock';
import { UpsListResponseDto } from '../ups.list.response.dto';
import { UpsResponseDto } from '../ups.response.dto';

describe('UpsListResponseDto', () => {
  it('should set all properties correctly', () => {
    const item = createMockUps();

    const items = [item];
    const totalItems = 15;
    const currentPage = 2;
    const pageSize = 10;

    const dto = new UpsListResponseDto(
      items,
      totalItems,
      currentPage,
      pageSize,
    );

    expect(dto.items).toEqual(items);
    expect(dto.totalItems).toBe(totalItems);
    expect(dto.currentPage).toBe(currentPage);
    expect(dto.totalPages).toBe(Math.ceil(totalItems / pageSize));
  });

  it('should support empty items', () => {
    const items: UpsResponseDto[] = [];
    const totalItems = 0;
    const currentPage = 1;
    const pageSize = 10;

    const dto = new UpsListResponseDto(
      items,
      totalItems,
      currentPage,
      pageSize,
    );

    expect(dto.items).toEqual([]);
    expect(dto.totalItems).toBe(0);
    expect(dto.currentPage).toBe(1);
    expect(dto.totalPages).toBe(0);
  });
});
