import { mockRoom, mockRoomRepository } from '@/modules/rooms/__mocks__';
import { GetAllRoomsUseCase } from '@/modules/rooms/application/use-cases';
import { RoomResponseDto } from '@/modules/rooms/application/dto';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';

describe('GetAllRoomsUseCase', () => {
  it('should return an array of room response DTOs', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const useCase = new GetAllRoomsUseCase(roomRepository);
    const rooms = [mockRoom(), mockRoom()];
    roomRepository.findAll.mockResolvedValue(rooms);

    const result = await useCase.execute();

    expect(roomRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(rooms.map((room) => RoomResponseDto.from(room)));
  });
});
