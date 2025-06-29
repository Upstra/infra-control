import { RoomController } from './room.controller';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CreateRoomUseCase,
  DeleteRoomUseCase,
  GetAllRoomsUseCase,
  GetRoomByIdUseCase,
  UpdateRoomUseCase,
} from '@/modules/rooms/application/use-cases';
import {
  mockRoomCreationDto,
  mockRoomResponseDto,
} from '@/modules/rooms/__mocks__';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('RoomController', () => {
  let controller: RoomController;

  const getAllRoomsUseCase = { execute: jest.fn() };
  const getRoomByIdUseCase = { execute: jest.fn() };
  const createRoomUseCase = { execute: jest.fn() };
  const updateRoomUseCase = { execute: jest.fn() };
  const deleteRoomUseCase = { execute: jest.fn() };

  const mockRoomResponse = mockRoomResponseDto();

  const mockPayload: JwtPayload = {
    userId: 'user-123',
    email: 'john.doe@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        { provide: GetAllRoomsUseCase, useValue: getAllRoomsUseCase },
        { provide: GetRoomByIdUseCase, useValue: getRoomByIdUseCase },
        { provide: CreateRoomUseCase, useValue: createRoomUseCase },
        { provide: UpdateRoomUseCase, useValue: updateRoomUseCase },
        { provide: DeleteRoomUseCase, useValue: deleteRoomUseCase },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
  });

  it('should return all rooms when getAllRooms is called', async () => {
    getAllRoomsUseCase.execute.mockResolvedValue([mockRoomResponse]);

    const rooms = await controller.getAllRooms();

    expect(rooms).toEqual([mockRoomResponse]);
    expect(getAllRoomsUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should return a room by ID when getRoomById is called', async () => {
    getRoomByIdUseCase.execute.mockResolvedValue(mockRoomResponse);

    const req: any = { userId: 'u1', email: 'e@test.com' };

    const result = await controller.getRoomById('uuid-test', req);

    expect(result).toEqual(mockRoomResponse);
    expect(getRoomByIdUseCase.execute).toHaveBeenCalledWith('uuid-test', 'u1');
    expect(getRoomByIdUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should create a room when createRoom is called', async () => {
    createRoomUseCase.execute.mockResolvedValue(mockRoomResponse);
    const dto = mockRoomCreationDto();

    const result = await controller.createRoom(mockPayload, dto);

    expect(result).toEqual(mockRoomResponse);
    expect(createRoomUseCase.execute).toHaveBeenCalledWith(
      dto,
      mockPayload.userId,
    );
    expect(createRoomUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should update a room when updateRoom is called', async () => {
    updateRoomUseCase.execute.mockResolvedValue(mockRoomResponse);
    const dto = mockRoomCreationDto();

    const result = await controller.updateRoom('uuid-test', dto, mockPayload);

    expect(result).toEqual(mockRoomResponse);
    expect(updateRoomUseCase.execute).toHaveBeenCalledWith(
      'uuid-test',
      dto,
      mockPayload.userId,
    );
    expect(updateRoomUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a room when deleteRoom is called', async () => {
    deleteRoomUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.deleteRoom('uuid-test', mockPayload);

    expect(result).toEqual(undefined);
    expect(deleteRoomUseCase.execute).toHaveBeenCalledWith(
      'uuid-test',
      mockPayload.userId,
    );
    expect(deleteRoomUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
