import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { GetUserServersUseCase } from '../get-user-servers.use-case';
import { ServerResponseDto } from '../../dto/server.response.dto';
import { ServerListResponseDto } from '../../dto/server.list.response.dto';

describe('GetUserServersUseCase', () => {
  let useCase: GetUserServersUseCase;
  let userRepo: any;
  let permissionRepo: any;
  let serverRepo: any;

  beforeEach(() => {
    userRepo = { findOneByField: jest.fn() };
    permissionRepo = { findAllByField: jest.fn() };
    serverRepo = {
      findAllByField: jest.fn(),
      findAllByFieldPaginated: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new GetUserServersUseCase(userRepo, permissionRepo, serverRepo);
  });

  describe('Admin functionality', () => {
    it('should return all servers when user is admin', async () => {
      const adminUser = {
        id: 'admin-user',
        roles: [{ id: 'admin-role', isAdmin: true }],
      };
      userRepo.findOneByField.mockResolvedValue(adminUser);

      const allServers = [
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' },
        { id: 'srv-3', name: 'Server 3' },
      ];
      serverRepo.findAll.mockResolvedValue(allServers);

      jest
        .spyOn(ServerResponseDto, 'fromEntity')
        .mockImplementation((s: any) => ({ id: s.id, name: s.name }) as any);

      const result = await useCase.execute('admin-user', 1, 2);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([
        { id: 'srv-1', name: 'Server 1' },
        { id: 'srv-2', name: 'Server 2' },
      ]);
      expect(result.totalItems).toBe(3);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(serverRepo.findAll).toHaveBeenCalled();
      expect(permissionRepo.findAllByField).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly for admin users', async () => {
      const adminUser = {
        id: 'admin-user-2',
        roles: [{ id: 'admin-role-2', isAdmin: true }],
      };
      userRepo.findOneByField.mockResolvedValue(adminUser);

      const allServers = Array.from({ length: 25 }, (_, i) => ({
        id: `srv-${i + 1}`,
        name: `Server ${i + 1}`,
      }));
      serverRepo.findAll.mockResolvedValue(allServers);

      jest
        .spyOn(ServerResponseDto, 'fromEntity')
        .mockImplementation((s: any) => ({ id: s.id, name: s.name }) as any);

      const result = await useCase.execute('admin-user-2', 3, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toHaveLength(5);
      expect(result.items[0]).toEqual({ id: 'srv-21', name: 'Server 21' });
      expect(result.items[4]).toEqual({ id: 'srv-25', name: 'Server 25' });
      expect(result.totalItems).toBe(25);
      expect(result.currentPage).toBe(3);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty list if admin has access to no servers', async () => {
      const adminUser = {
        id: 'admin-user-3',
        roles: [{ id: 'admin-role-3', isAdmin: true }],
      };
      userRepo.findOneByField.mockResolvedValue(adminUser);
      serverRepo.findAll.mockResolvedValue([]);

      const result = await useCase.execute('admin-user-3', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should handle admin error gracefully', async () => {
      const adminUser = {
        id: 'admin-user-error',
        roles: [{ id: 'admin-role-error', isAdmin: true }],
      };
      userRepo.findOneByField.mockResolvedValue(adminUser);
      serverRepo.findAll.mockRejectedValue(new Error('Database error'));

      const result = await useCase.execute('admin-user-error', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('Basic pagination functionality', () => {
    it('should return empty paginated response if user has no role', async () => {
      userRepo.findOneByField.mockResolvedValue({ id: 'user-1', roles: [] });

      const result = await useCase.execute('user-1', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty paginated response if no permissions found', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-2',
        roles: [{ id: 'role-2', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([]);

      const result = await useCase.execute('user-2', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty paginated response if user has no READ permissions', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-3',
        roles: [{ id: 'role-3', isAdmin: false }],
      });

      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: 'srv-1', bitmask: PermissionBit.WRITE },
        { serverId: 'srv-2', bitmask: PermissionBit.WRITE },
      ]);

      const result = await useCase.execute('user-3', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should return empty paginated response if READ permissions point only to null serverIds', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-4',
        roles: [{ id: 'role-4', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: null, bitmask: PermissionBit.READ },
        { serverId: null, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ]);

      const result = await useCase.execute('user-4', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('Successful pagination scenarios', () => {
    it('should return paginated servers if READ permissions and servers found', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-5',
        roles: [{ id: 'role-5', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: 'srv-42', bitmask: PermissionBit.READ },
        {
          serverId: 'srv-43',
          bitmask: PermissionBit.READ | PermissionBit.WRITE,
        },
      ]);

      serverRepo.findAllByFieldPaginated.mockResolvedValue([
        [
          { id: 'srv-42', name: 'Serveur 42' },
          { id: 'srv-43', name: 'Serveur 43' },
        ],
        2,
      ]);

      jest
        .spyOn(ServerResponseDto, 'fromEntity')
        .mockImplementation((s: any) => ({ id: s.id, name: s.name }) as any);

      const result = await useCase.execute('user-5', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([
        { id: 'srv-42', name: 'Serveur 42' },
        { id: 'srv-43', name: 'Serveur 43' },
      ]);
      expect(result.totalItems).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);

      expect(serverRepo.findAllByFieldPaginated).toHaveBeenCalledWith(
        {
          field: 'id',
          value: ['srv-42', 'srv-43'],
          relations: ['ilo'],
        },
        1,
        10,
      );
    });

    it('should handle different page and limit values correctly', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-6',
        roles: [{ id: 'role-6', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: 'srv-1', bitmask: PermissionBit.READ },
        { serverId: 'srv-2', bitmask: PermissionBit.READ },
        { serverId: 'srv-3', bitmask: PermissionBit.READ },
      ]);

      serverRepo.findAllByFieldPaginated.mockResolvedValue([
        [{ id: 'srv-2', name: 'Serveur 2' }],
        3,
      ]);

      jest
        .spyOn(ServerResponseDto, 'fromEntity')
        .mockImplementation((s: any) => ({ id: s.id, name: s.name }) as any);

      const result = await useCase.execute('user-6', 2, 1);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([{ id: 'srv-2', name: 'Serveur 2' }]);
      expect(result.totalItems).toBe(3);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(3);

      expect(serverRepo.findAllByFieldPaginated).toHaveBeenCalledWith(
        {
          field: 'id',
          value: ['srv-1', 'srv-2', 'srv-3'],
          relations: ['ilo'],
        },
        2,
        1,
      );
    });

    it('should use default pagination values when not provided', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-7',
        roles: [{ id: 'role-7', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: 'srv-default', bitmask: PermissionBit.READ },
      ]);

      serverRepo.findAllByFieldPaginated.mockResolvedValue([
        [{ id: 'srv-default', name: 'Default Server' }],
        1,
      ]);

      jest
        .spyOn(ServerResponseDto, 'fromEntity')
        .mockImplementation((s: any) => ({ id: s.id, name: s.name }) as any);

      const result = await useCase.execute('user-7');

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);

      expect(serverRepo.findAllByFieldPaginated).toHaveBeenCalledWith(
        {
          field: 'id',
          value: ['srv-default'],
          relations: ['ilo'],
        },
        1,
        10,
      );
    });
  });

  describe('Error handling', () => {
    it('should return empty paginated response if an error is thrown by repo', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-error',
        roles: [{ id: 'role-error', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: 'srv-99', bitmask: PermissionBit.READ },
      ]);
      serverRepo.findAllByFieldPaginated.mockRejectedValue(
        new Error('DB crashed'),
      );

      const result = await useCase.execute('user-error', 1, 10);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should preserve page and limit values in error responses', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-error-2',
        roles: [{ id: 'role-error-2', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: 'srv-error', bitmask: PermissionBit.READ },
      ]);
      serverRepo.findAllByFieldPaginated.mockRejectedValue(
        new Error('Network error'),
      );

      const result = await useCase.execute('user-error-2', 3, 5);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.currentPage).toBe(3);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle large server lists with pagination', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-large',
        roles: [{ id: 'role-large', isAdmin: false }],
      });

      const serverIds = Array.from({ length: 100 }, (_, i) => `srv-${i + 1}`);
      const permissions = serverIds.map((id) => ({
        serverId: id,
        bitmask: PermissionBit.READ,
      }));
      permissionRepo.findAllByField.mockResolvedValue(permissions);

      const pageServers = Array.from({ length: 20 }, (_, i) => ({
        id: `srv-${i + 21}`,
        name: `Server ${i + 21}`,
      }));
      serverRepo.findAllByFieldPaginated.mockResolvedValue([pageServers, 100]);

      jest
        .spyOn(ServerResponseDto, 'fromEntity')
        .mockImplementation((s: any) => ({ id: s.id, name: s.name }) as any);

      const result = await useCase.execute('user-large', 2, 20);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toHaveLength(20);
      expect(result.totalItems).toBe(100);
      expect(result.currentPage).toBe(2);
      expect(result.totalPages).toBe(5);
    });

    it('should handle zero limit gracefully', async () => {
      userRepo.findOneByField.mockResolvedValue({
        id: 'user-zero',
        roles: [{ id: 'role-zero', isAdmin: false }],
      });
      permissionRepo.findAllByField.mockResolvedValue([
        { serverId: 'srv-zero', bitmask: PermissionBit.READ },
      ]);

      serverRepo.findAllByFieldPaginated.mockResolvedValue([[], 1]);

      const result = await useCase.execute('user-zero', 1, 0);

      expect(result).toBeInstanceOf(ServerListResponseDto);
      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(Infinity);
    });
  });
});
