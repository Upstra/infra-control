import { GetRoomListUseCase } from '../get-room-list.use-case';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { createMockRoom } from '@/modules/rooms/__mocks__/rooms.mock';

describe('GetRoomListUseCase', () => {
  let repo: jest.Mocked<RoomRepositoryInterface>;
  let useCase: GetRoomListUseCase;

  beforeEach(() => {
    repo = { paginate: jest.fn() } as any;
    useCase = new GetRoomListUseCase(repo);
  });

  it('should return paginated rooms', async () => {
    const rooms = [createMockRoom({ id: '1' })];
    repo.paginate.mockResolvedValue([rooms, 1]);

    const result = await useCase.execute(2, 5, true);

    expect(repo.paginate).toHaveBeenCalledWith(2, 5);
    expect(result.items).toHaveLength(1);
    expect(result.totalItems).toBe(1);
    expect(result.currentPage).toBe(2);
  });

  it('should handle empty list', async () => {
    repo.paginate.mockResolvedValue([[], 0]);

    const result = await useCase.execute();

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });
});
