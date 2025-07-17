import {
  VmTreeDto,
  ServerTreeDto,
  UpsTreeDto,
  RoomTreeDto,
  RoomTreeListResponseDto,
} from '../room-tree.dto';

describe('Room Tree DTOs', () => {
  describe('VmTreeDto', () => {
    it('should create instance with correct properties', () => {
      const dto = new VmTreeDto('vm-id', 'VM Name');
      
      expect(dto.id).toBe('vm-id');
      expect(dto.name).toBe('VM Name');
    });
  });

  describe('ServerTreeDto', () => {
    it('should create instance with VMs', () => {
      const vm1 = new VmTreeDto('vm-1', 'VM 1');
      const vm2 = new VmTreeDto('vm-2', 'VM 2');
      const dto = new ServerTreeDto('server-id', 'Server Name', [vm1, vm2]);
      
      expect(dto.id).toBe('server-id');
      expect(dto.name).toBe('Server Name');
      expect(dto.vms).toHaveLength(2);
      expect(dto.vms[0]).toBe(vm1);
      expect(dto.vms[1]).toBe(vm2);
    });

    it('should create instance with empty VMs array by default', () => {
      const dto = new ServerTreeDto('server-id', 'Server Name');
      
      expect(dto.vms).toEqual([]);
    });
  });

  describe('UpsTreeDto', () => {
    it('should create instance with correct properties', () => {
      const dto = new UpsTreeDto('ups-id', 'UPS Name');
      
      expect(dto.id).toBe('ups-id');
      expect(dto.name).toBe('UPS Name');
    });
  });

  describe('RoomTreeDto', () => {
    it('should create instance with servers and ups', () => {
      const server = new ServerTreeDto('server-1', 'Server 1');
      const ups = new UpsTreeDto('ups-1', 'UPS 1');
      const dto = new RoomTreeDto('room-id', 'Room Name', [server], [ups]);
      
      expect(dto.id).toBe('room-id');
      expect(dto.name).toBe('Room Name');
      expect(dto.servers).toHaveLength(1);
      expect(dto.servers[0]).toBe(server);
      expect(dto.ups).toHaveLength(1);
      expect(dto.ups[0]).toBe(ups);
    });

    it('should create instance with empty arrays by default', () => {
      const dto = new RoomTreeDto('room-id', 'Room Name');
      
      expect(dto.servers).toEqual([]);
      expect(dto.ups).toEqual([]);
    });
  });

  describe('RoomTreeListResponseDto', () => {
    it('should create instance with pagination info', () => {
      const room1 = new RoomTreeDto('room-1', 'Room 1');
      const room2 = new RoomTreeDto('room-2', 'Room 2');
      const dto = new RoomTreeListResponseDto([room1, room2], 50, 2, 10);
      
      expect(dto.rooms).toHaveLength(2);
      expect(dto.rooms[0]).toBe(room1);
      expect(dto.rooms[1]).toBe(room2);
      expect(dto.total).toBe(50);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(10);
    });
  });
});