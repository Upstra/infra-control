import { CreateRoomUseCase } from '@/modules/rooms/application/use-cases';
import { RoomResponseDto } from '@/modules/rooms/application/dto';
import {
  mockRoomCreationDto,
  mockRoom,
  mockRoomRepository,
} from '@/modules/rooms/__mocks__';

describe('CreateRoomUseCase', () => {
  it('should create a room and return its response DTO', async () => {
    const roomRepository = mockRoomRepository();
    const useCase = new CreateRoomUseCase(roomRepository);
    const room = mockRoom();
    const roomDto = mockRoomCreationDto();
    roomRepository.createRoom.mockResolvedValue(room);

    const result = await useCase.execute(roomDto);

    expect(roomRepository.createRoom).toHaveBeenCalledWith(roomDto.name);
    expect(result).toEqual(RoomResponseDto.from(room));
  });
});
