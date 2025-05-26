import {
  mockRoom,
  mockRoomRepository,
  mockRoomCreationDto,
} from '@/modules/rooms/__mocks__';
import { UpdateRoomUseCase } from '@/modules/rooms/application/use-cases';
import { RoomResponseDto } from '@/modules/rooms/application/dto';

describe('UpdateRoomUseCase', () => {
  it('should update a room and return its response DTO', async () => {
    const roomRepository = mockRoomRepository();
    const useCase = new UpdateRoomUseCase(roomRepository);
    const room = mockRoom();
    const roomDto = mockRoomCreationDto();
    roomRepository.updateRoom.mockResolvedValue(room);

    const result = await useCase.execute(room.id, roomDto);

    expect(roomRepository.updateRoom).toHaveBeenCalledWith(
      room.id,
      roomDto.name,
    );
    expect(result).toEqual(RoomResponseDto.from(room));
  });
});
