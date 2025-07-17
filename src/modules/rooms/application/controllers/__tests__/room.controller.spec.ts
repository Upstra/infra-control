import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from '../room.controller';
import {
  CreateRoomUseCase,
  DeleteRoomUseCase,
  GetRoomListUseCase,
  GetAllRoomsUseCase,
  GetRoomByIdUseCase,
  UpdateRoomUseCase,
  GetRoomTreeListUseCase,
} from '../../use-cases';
import { RoomTreeListResponseDto } from '../../dto/room-tree.dto';

describe('RoomController', () => {
  let controller: RoomController;
  let getRoomTreeListUseCase: jest.Mocked<GetRoomTreeListUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        {
          provide: GetAllRoomsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetRoomListUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetRoomByIdUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CreateRoomUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateRoomUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteRoomUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetRoomTreeListUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    getRoomTreeListUseCase = module.get(GetRoomTreeListUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoomTree', () => {
    it('should return room tree list with default pagination', async () => {
      const mockResponse = new RoomTreeListResponseDto([], 0, 1, 10);
      getRoomTreeListUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getRoomTree();

      expect(getRoomTreeListUseCase.execute).toHaveBeenCalledWith(1, 10);
      expect(result).toBe(mockResponse);
    });

    it('should return room tree list with custom pagination', async () => {
      const mockResponse = new RoomTreeListResponseDto([], 50, 3, 20);
      getRoomTreeListUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getRoomTree('3', '20');

      expect(getRoomTreeListUseCase.execute).toHaveBeenCalledWith(3, 20);
      expect(result).toBe(mockResponse);
    });

    it('should handle string page and limit parameters', async () => {
      const mockResponse = new RoomTreeListResponseDto([], 100, 5, 15);
      getRoomTreeListUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getRoomTree('5', '15');

      expect(getRoomTreeListUseCase.execute).toHaveBeenCalledWith(5, 15);
      expect(result).toBe(mockResponse);
    });

    it('should use default values for invalid parameters', async () => {
      const mockResponse = new RoomTreeListResponseDto([], 0, 1, 10);
      getRoomTreeListUseCase.execute.mockResolvedValue(mockResponse);

      const result = await controller.getRoomTree('invalid', 'invalid');

      expect(getRoomTreeListUseCase.execute).toHaveBeenCalledWith(NaN, NaN);
      expect(result).toBe(mockResponse);
    });
  });
});