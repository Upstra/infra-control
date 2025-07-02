import { createMockRoom } from '@/modules/rooms/__mocks__/rooms.mock';
import { RoomResponseDto } from '../room.response.dto';
import { RoomListResponseDto } from '../room.list.response.dto';

describe('RoomListResponseDto', () => {
  it('should set properties correctly', () => {
    const items = [RoomResponseDto.from(createMockRoom())];
    const dto = new RoomListResponseDto(items, 5, 2, 2);
    expect(dto.items).toEqual(items);
    expect(dto.totalItems).toBe(5);
    expect(dto.currentPage).toBe(2);
    expect(dto.totalPages).toBe(3);
  });

  it('should support empty items', () => {
    const dto = new RoomListResponseDto([], 0, 1, 10);
    expect(dto.items).toEqual([]);
    expect(dto.totalItems).toBe(0);
    expect(dto.totalPages).toBe(0);
  });
});
