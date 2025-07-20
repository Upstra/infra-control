import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RoomTypeormRepository } from '../room.typeorm.repository';
import { Room } from '../../../domain/entities/room.entity';
import { RoomNotFoundException } from '../../../domain/exceptions/room.exception';
import { InvalidQueryValueException } from '@/core/exceptions/repository.exception';

describe('RoomTypeormRepository', () => {
  let repository: RoomTypeormRepository;
  let typeOrmRepository: jest.Mocked<Repository<Room>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Room>>;

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomTypeormRepository,
        {
          provide: getRepositoryToken(Room),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            count: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
      ],
    }).compile();

    repository = module.get<RoomTypeormRepository>(RoomTypeormRepository);
    typeOrmRepository = module.get(getRepositoryToken(Room));
  });

  describe('paginateForTree', () => {
    it('should return rooms with minimal fields for tree navigation', async () => {
      const mockRooms = [
        {
          id: 'room-1',
          name: 'Room 1',
          servers: [
            {
              id: 'server-1',
              name: 'Server 1',
              vms: [
                { id: 'vm-1', name: 'VM 1' },
                { id: 'vm-2', name: 'VM 2' },
              ],
            },
          ],
          ups: [{ id: 'ups-1', name: 'UPS 1' }],
        },
      ] as any;

      queryBuilder.getManyAndCount.mockResolvedValue([mockRooms, 1]);

      const result = await repository.paginateForTree(1, 10);

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('room');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'room.servers',
        'server',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'server.vms',
        'vm',
      );
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'room.ups',
        'ups',
      );
      expect(queryBuilder.select).toHaveBeenCalledWith([
        'room.id',
        'room.name',
        'server.id',
        'server.name',
        'vm.id',
        'vm.name',
        'ups.id',
        'ups.name',
      ]);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('room.name', 'ASC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'server.name',
        'ASC',
      );
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('vm.name', 'ASC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('ups.name', 'ASC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual([mockRooms, 1]);
    });

    it('should handle pagination correctly', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.paginateForTree(3, 20);

      expect(queryBuilder.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('save', () => {
    it('should save a room entity', async () => {
      const room = new Room();
      typeOrmRepository.save.mockResolvedValue(room);

      const result = await repository.save(room);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(room);
      expect(result).toBe(room);
    });
  });

  describe('count', () => {
    it('should return the count of rooms', async () => {
      typeOrmRepository.count.mockResolvedValue(5);

      const result = await repository.count();

      expect(typeOrmRepository.count).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('findOneByField', () => {
    it('should find a room by field', async () => {
      const room = new Room();
      room.id = '123';
      typeOrmRepository.findOne.mockResolvedValue(room);

      const result = await repository.findOneByField({
        field: 'id',
        value: '123',
      });

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: [],
      });
      expect(result).toBe(room);
    });

    it('should throw RoomNotFoundException when room not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.findOneByField({ field: 'id', value: '123' }),
      ).rejects.toThrow(RoomNotFoundException);
    });

    it('should not throw when disableThrow is true', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOneByField({
        field: 'id',
        value: '123',
        disableThrow: true,
      });

      expect(result).toBeNull();
    });

    it('should throw InvalidQueryValueException for invalid value', async () => {
      await expect(
        repository.findOneByField({ field: 'id', value: null }),
      ).rejects.toThrow(InvalidQueryValueException);
    });
  });

  describe('findAll', () => {
    it('should return all rooms with relations', async () => {
      const rooms = [new Room()];
      typeOrmRepository.find.mockResolvedValue(rooms);

      const result = await repository.findAll();

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        relations: ['servers', 'servers.ilo', 'ups'],
      });
      expect(result).toBe(rooms);
    });
  });

  describe('paginate', () => {
    it('should paginate rooms', async () => {
      const rooms = [new Room()];
      typeOrmRepository.findAndCount.mockResolvedValue([rooms, 10]);

      const result = await repository.paginate(2, 5);

      expect(typeOrmRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['servers', 'servers.ilo', 'ups'],
        skip: 5,
        take: 5,
        order: { name: 'ASC' },
      });
      expect(result).toEqual([rooms, 10]);
    });
  });

  describe('findRoomById', () => {
    it('should find a room by id', async () => {
      const room = new Room();
      room.id = '123';
      typeOrmRepository.findOne.mockResolvedValue(room);

      const result = await repository.findRoomById('123');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['servers', 'servers.ilo', 'ups'],
      });
      expect(result).toBe(room);
    });

    it('should throw RoomNotFoundException when room not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.findRoomById('123')).rejects.toThrow(
        RoomNotFoundException,
      );
    });
  });

  describe('createRoom', () => {
    it('should create a new room', async () => {
      const newRoom = new Room();
      newRoom.name = 'Test Room';
      typeOrmRepository.create.mockReturnValue(newRoom);
      typeOrmRepository.save.mockResolvedValue(newRoom);

      const result = await repository.createRoom('Test Room');

      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        name: 'Test Room',
        servers: [],
        ups: [],
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(newRoom);
      expect(result).toBe(newRoom);
    });
  });

  describe('updateRoom', () => {
    it('should update a room', async () => {
      const room = new Room();
      room.id = '123';
      room.name = 'Old Name';
      typeOrmRepository.findOne.mockResolvedValue(room);
      const updatedRoom = Object.assign(new Room(), room, { name: 'New Name' });
      typeOrmRepository.save.mockResolvedValue(updatedRoom);

      const result = await repository.updateRoom('123', 'New Name');

      expect(room.name).toBe('New Name');
      expect(typeOrmRepository.save).toHaveBeenCalledWith(room);
      expect(result.name).toBe('New Name');
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room', async () => {
      const room = new Room();
      room.id = '123';
      typeOrmRepository.findOne.mockResolvedValue(room);

      await repository.deleteRoom('123');

      expect(typeOrmRepository.delete).toHaveBeenCalledWith('123');
    });

    it('should throw if room not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(repository.deleteRoom('123')).rejects.toThrow(
        RoomNotFoundException,
      );
    });
  });
});
