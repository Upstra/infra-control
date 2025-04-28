import { RoomController } from './room.controller';
import { RoomCreationDto } from '../dto/room.creation.dto';
import { RoomResponseDto } from '../dto/room.response.dto';
import { RoomService } from '../../../application/services/room.service';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';

describe('RoomController', () => {
  let controller: RoomController;
  let service: RoomService;

  let mockRoom: RoomResponseDto = {
    id: uuidv4().toString(),
    name: 'Room 69',
  };

  const mockService = {
    getAllRooms: jest.fn().mockResolvedValue([mockRoom]),
    getRoomById: jest.fn().mockResolvedValue(mockRoom),
    createRoom: jest.fn().mockResolvedValue(mockRoom),
    updateRoom: jest.fn().mockResolvedValue(mockRoom),
    deleteRoom: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        {
          provide: RoomService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    service = module.get<RoomService>(RoomService);
  });

  it('it should return all rooms', async () => {
    const rooms = await controller.getAllRooms();
    expect(rooms).toEqual([mockRoom]);
    expect(service.getAllRooms).toHaveBeenCalled();
  });

  it('should return all rooms', async () => {
    const result = await controller.getAllRooms();
    expect(result).toEqual([mockRoom]);
    expect(service.getAllRooms).toHaveBeenCalled();
  });

  it('should return a room by ID', async () => {
    const result = await controller.getRoomById('uuid-test');
    expect(result).toEqual(mockRoom);
    expect(service.getRoomById).toHaveBeenCalledWith('uuid-test');
  });

  it('should create a room', async () => {
    const dto: RoomCreationDto = { name: 'Salle test' };
    const result = await controller.createRoom(dto);
    expect(result).toEqual(mockRoom);
    expect(service.createRoom).toHaveBeenCalledWith(dto);
  });

  it('should update a room', async () => {
    const dto: RoomCreationDto = { name: 'Salle modifiée' };
    const result = await controller.updateRoom('uuid-test', dto);
    expect(result).toEqual(mockRoom);
    expect(service.updateRoom).toHaveBeenCalledWith('uuid-test', dto);
  });

  it('should delete a room', async () => {
    await controller.deleteRoom('uuid-test');
    expect(service.deleteRoom).toHaveBeenCalledWith('uuid-test');
  });
});
