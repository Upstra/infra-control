import { mockRoomRepository } from '@/modules/rooms/__mocks__';
import { DeleteRoomUseCase } from '@/modules/rooms/application/use-cases';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';

describe('DeleteRoomUseCase', () => {
  it('should delete a room and return nothing', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const useCase = new DeleteRoomUseCase(roomRepository);
    const roomId = 'room-id';
    roomRepository.deleteRoom.mockResolvedValue(undefined);

    await useCase.execute(roomId);

    expect(roomRepository.deleteRoom).toHaveBeenCalledWith(roomId);
    expect(roomRepository.deleteRoom).toHaveBeenCalledTimes(1);
  });
});
