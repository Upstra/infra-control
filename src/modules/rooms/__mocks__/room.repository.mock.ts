import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';

export const mockRoomRepository = (): RoomRepositoryInterface => ({
  createRoom: jest.fn(),
  findRoomById: jest.fn(),
  updateRoom: jest.fn(),
  deleteRoom: jest.fn(),

  count: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  findOneByField: jest.fn(),
});
