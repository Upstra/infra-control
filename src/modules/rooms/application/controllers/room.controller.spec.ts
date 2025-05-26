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

describe('RoomController', () => {
  let controller: RoomController;

  const getAllRoomsUseCase = { execute: jest.fn() };
  const getRoomByIdUseCase = { execute: jest.fn() };
  const createRoomUseCase = { execute: jest.fn() };
  const updateRoomUseCase = { execute: jest.fn() };
  const deleteRoomUseCase = { execute: jest.fn() };

  const mockRoomResponse = mockRoomResponseDto();

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

    const result = await controller.getRoomById('uuid-test');

    expect(result).toEqual(mockRoomResponse);
    expect(getRoomByIdUseCase.execute).toHaveBeenCalledWith('uuid-test');
    expect(getRoomByIdUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should create a room when createRoom is called', async () => {
    createRoomUseCase.execute.mockResolvedValue(mockRoomResponse);
    const dto = mockRoomCreationDto();

    const result = await controller.createRoom(dto);

    expect(result).toEqual(mockRoomResponse);
    expect(createRoomUseCase.execute).toHaveBeenCalledWith(dto);
    expect(createRoomUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should update a room when updateRoom is called', async () => {
    updateRoomUseCase.execute.mockResolvedValue(mockRoomResponse);
    const dto = mockRoomCreationDto();

    const result = await controller.updateRoom('uuid-test', dto);

    expect(result).toEqual(mockRoomResponse);
    expect(updateRoomUseCase.execute).toHaveBeenCalledWith('uuid-test', dto);
    expect(updateRoomUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should delete a room when deleteRoom is called', async () => {
    deleteRoomUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.deleteRoom('uuid-test');

    expect(result).toEqual(undefined);
    expect(deleteRoomUseCase.execute).toHaveBeenCalledWith('uuid-test');
    expect(deleteRoomUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
