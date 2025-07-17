import { Test, TestingModule } from '@nestjs/testing';
import { GetRoomTreeListUseCase } from '../get-room-tree-list.use-case';
import { RoomRepositoryInterface } from '../../../domain/interfaces/room.repository.interface';
import { Room } from '../../../domain/entities/room.entity';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';

describe('GetRoomTreeListUseCase', () => {
  let useCase: GetRoomTreeListUseCase;
  let roomRepository: jest.Mocked<RoomRepositoryInterface>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRoomTreeListUseCase,
        {
          provide: 'RoomRepositoryInterface',
          useValue: {
            paginateForTree: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetRoomTreeListUseCase>(GetRoomTreeListUseCase);
    roomRepository = module.get('RoomRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return room tree list with default pagination', async () => {
      const mockRooms: Room[] = [];
      roomRepository.paginateForTree.mockResolvedValue([mockRooms, 0]);

      const result = await useCase.execute();

      expect(roomRepository.paginateForTree).toHaveBeenCalledWith(1, 10);
      expect(result.rooms).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return room tree list with custom pagination', async () => {
      const mockRooms: Room[] = [];
      roomRepository.paginateForTree.mockResolvedValue([mockRooms, 50]);

      const result = await useCase.execute(3, 20);

      expect(roomRepository.paginateForTree).toHaveBeenCalledWith(3, 20);
      expect(result.total).toBe(50);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
    });

    it('should map rooms with servers and VMs correctly', async () => {
      const vm1 = new Vm();
      vm1.id = 'vm-1';
      vm1.name = 'VM 1';

      const vm2 = new Vm();
      vm2.id = 'vm-2';
      vm2.name = 'VM 2';

      const server1 = new Server();
      server1.id = 'server-1';
      server1.name = 'Server 1';
      server1.vms = [vm1, vm2];

      const server2 = new Server();
      server2.id = 'server-2';
      server2.name = 'Server 2';
      server2.vms = [];

      const ups1 = new Ups();
      ups1.id = 'ups-1';
      ups1.name = 'UPS 1';

      const room1 = new Room();
      room1.id = 'room-1';
      room1.name = 'Room 1';
      room1.servers = [server1, server2];
      room1.ups = [ups1];

      roomRepository.paginateForTree.mockResolvedValue([[room1], 1]);

      const result = await useCase.execute();

      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].id).toBe('room-1');
      expect(result.rooms[0].name).toBe('Room 1');
      expect(result.rooms[0].servers).toHaveLength(2);
      expect(result.rooms[0].servers[0].id).toBe('server-1');
      expect(result.rooms[0].servers[0].name).toBe('Server 1');
      expect(result.rooms[0].servers[0].vms).toHaveLength(2);
      expect(result.rooms[0].servers[0].vms[0].id).toBe('vm-1');
      expect(result.rooms[0].servers[0].vms[0].name).toBe('VM 1');
      expect(result.rooms[0].servers[1].vms).toHaveLength(0);
      expect(result.rooms[0].ups).toHaveLength(1);
      expect(result.rooms[0].ups[0].id).toBe('ups-1');
      expect(result.rooms[0].ups[0].name).toBe('UPS 1');
    });

    it('should handle rooms without servers or ups', async () => {
      const room = new Room();
      room.id = 'room-1';
      room.name = 'Empty Room';
      room.servers = undefined;
      room.ups = undefined;

      roomRepository.paginateForTree.mockResolvedValue([[room], 1]);

      const result = await useCase.execute();

      expect(result.rooms[0].servers).toEqual([]);
      expect(result.rooms[0].ups).toEqual([]);
    });

    it('should handle servers without VMs', async () => {
      const server = new Server();
      server.id = 'server-1';
      server.name = 'Server 1';
      server.vms = undefined;

      const room = new Room();
      room.id = 'room-1';
      room.name = 'Room 1';
      room.servers = [server];
      room.ups = [];

      roomRepository.paginateForTree.mockResolvedValue([[room], 1]);

      const result = await useCase.execute();

      expect(result.rooms[0].servers[0].vms).toEqual([]);
    });

    it('should handle multiple rooms with complex structure', async () => {
      const room1 = new Room();
      room1.id = 'room-1';
      room1.name = 'Data Center 1';
      
      const server1 = new Server();
      server1.id = 'server-1';
      server1.name = 'ESXi Host 1';
      
      const vm1 = new Vm();
      vm1.id = 'vm-1';
      vm1.name = 'Web Server';
      
      server1.vms = [vm1];
      room1.servers = [server1];
      room1.ups = [];

      const room2 = new Room();
      room2.id = 'room-2';
      room2.name = 'Data Center 2';
      room2.servers = [];
      
      const ups1 = new Ups();
      ups1.id = 'ups-1';
      ups1.name = 'Main UPS';
      
      room2.ups = [ups1];

      roomRepository.paginateForTree.mockResolvedValue([[room1, room2], 2]);

      const result = await useCase.execute();

      expect(result.rooms).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.rooms[0].name).toBe('Data Center 1');
      expect(result.rooms[0].servers).toHaveLength(1);
      expect(result.rooms[0].servers[0].vms).toHaveLength(1);
      expect(result.rooms[1].name).toBe('Data Center 2');
      expect(result.rooms[1].servers).toHaveLength(0);
      expect(result.rooms[1].ups).toHaveLength(1);
    });
  });
});