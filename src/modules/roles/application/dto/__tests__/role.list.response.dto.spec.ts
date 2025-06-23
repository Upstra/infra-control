import { RoleListResponseDto } from '../role.list.response.dto';
import { RoleResponseDto } from '../role.response.dto';
import { createMockRole } from '@/modules/roles/__mocks__/role.mock';

describe('RoleListResponseDto', () => {
  it('should compute pagination correctly', () => {
    const roles = [
      new RoleResponseDto(createMockRole()),
      new RoleResponseDto(createMockRole()),
    ];
    const dto = new RoleListResponseDto(roles, 5, 2, 2);

    expect(dto.items.length).toBe(2);
    expect(dto.totalItems).toBe(5);
    expect(dto.currentPage).toBe(2);
    expect(dto.totalPages).toBe(3);
  });
});
