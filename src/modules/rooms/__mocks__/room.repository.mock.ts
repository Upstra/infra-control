export const mockRoomRepository = () => ({
  createRoom: jest.fn(),
  findAll: jest.fn(),
  findRoomById: jest.fn(),
  updateRoom: jest.fn(),
  deleteRoom: jest.fn(),
});
