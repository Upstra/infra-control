import { RoomTypeormRepository } from './room.typeorm.repository';
import { Repository } from 'typeorm';
import { Room } from '../../domain/entities/room.entity';
import { RoomNotFoundException } from '../../domain/exceptions/room.exception';
import { mockRoom } from '@/modules/rooms/__mocks__';

describe('RoomTypeormRepository', () => {
  let repository: RoomTypeormRepository;
  let mockRepo: jest.Mocked<Repository<Room>>;

  const room = mockRoom();

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Room>>;

    repository = new RoomTypeormRepository(mockRepo);
  });

  it('should find all rooms', async () => {
    mockRepo.find.mockResolvedValue([room]);

    const result = await repository.findAll();
    expect(result).toEqual([room]);
    expect(mockRepo.find).toHaveBeenCalledWith({
      relations: ['servers', 'servers.ilo', 'ups'],
    });
  });

  it('should find a room by id', async () => {
    mockRepo.findOne.mockResolvedValue(room);

    const result = await repository.findRoomById(room.id);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: room.id },
      relations: ['servers', 'servers.ilo', 'ups'],
    });
    expect(result).toEqual(room);
  });

  it('should throw RoomNotFoundException if room not found when searching by id', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(repository.findRoomById('uuid-1')).rejects.toThrow(
      RoomNotFoundException,
    );
  });

  it('should create and save a room', async () => {
    mockRepo.create.mockReturnValue(room);
    mockRepo.save.mockResolvedValue(room);

    const result = await repository.createRoom('Test Room');

    expect(mockRepo.create).toHaveBeenCalledWith({
      name: 'Test Room',
      servers: [],
      ups: [],
    });
    expect(mockRepo.save).toHaveBeenCalledWith(room);
    expect(result).toEqual(room);
  });

  it('should update a room name', async () => {
    mockRepo.findOne.mockResolvedValue(room);
    mockRepo.save.mockResolvedValue(room);

    const result = await repository.updateRoom(room.id, room.name);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: room.id },
      relations: ['servers', 'servers.ilo', 'ups'],
    });
    expect(mockRepo.save).toHaveBeenCalledWith(room);
    expect(result).toEqual(room);
  });

  it('should throw RoomNotFoundException if room not found when updating', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(room);

    await expect(repository.updateRoom(room.id, room.name)).rejects.toThrow(
      RoomNotFoundException,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should delete a room', async () => {
    mockRepo.findOne.mockResolvedValue(room);
    mockRepo.delete.mockResolvedValue(undefined);

    await repository.deleteRoom(room.id);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: room.id },
      relations: ['servers', 'servers.ilo', 'ups'],
    });
    expect(mockRepo.delete).toHaveBeenCalledWith(room.id);
  });

  it('should throw RoomNotFoundException if room not found when deleting', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(repository.deleteRoom(room.id)).rejects.toThrow(
      RoomNotFoundException,
    );
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
