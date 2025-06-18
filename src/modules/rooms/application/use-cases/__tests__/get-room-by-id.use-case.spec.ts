import { mockRoom, mockRoomRepository } from '@/modules/rooms/__mocks__';
import { GetRoomByIdUseCase } from '@/modules/rooms/application/use-cases';
import { RoomResponseDto } from '@/modules/rooms/application/dto';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';

describe('GetRoomByIdUseCase', () => {
  it('should return a room response DTO by ID', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const useCase = new GetRoomByIdUseCase(roomRepository);
    const room = mockRoom();
    const roomId = 'room-id';
    roomRepository.findRoomById.mockResolvedValue(room);

    const result = await useCase.execute(roomId);

    expect(roomRepository.findRoomById).toHaveBeenCalledWith(roomId);
    expect(roomRepository.findRoomById).toHaveBeenCalledTimes(1);
    expect(result).toEqual(RoomResponseDto.from(room));
  });
});
