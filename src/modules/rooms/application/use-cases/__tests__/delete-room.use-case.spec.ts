import { mockRoomRepository } from '@/modules/rooms/__mocks__';
import { DeleteRoomUseCase } from '@/modules/rooms/application/use-cases';

describe('DeleteRoomUseCase', () => {
  it('should delete a room and return nothing', async () => {
    const roomRepository = mockRoomRepository();
    const useCase = new DeleteRoomUseCase(roomRepository);
    const roomId = 'room-id';
    roomRepository.deleteRoom.mockResolvedValue(undefined);

    await useCase.execute(roomId);

    expect(roomRepository.deleteRoom).toHaveBeenCalledWith(roomId);
    expect(roomRepository.deleteRoom).toHaveBeenCalledTimes(1);
  });
});
