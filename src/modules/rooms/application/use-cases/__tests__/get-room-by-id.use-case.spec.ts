import { mockRoom, mockRoomRepository } from '@/modules/rooms/__mocks__';
import { GetRoomByIdUseCase } from '@/modules/rooms/application/use-cases';
import { RoomRepositoryInterface } from '@/modules/rooms/domain/interfaces/room.repository.interface';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { createMockPermissionServer } from '@/modules/permissions/__mocks__/permissions.mock';
import { createMockUser } from '@/modules/auth/__mocks__/user.mock';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { PermissionServerRepositoryInterface } from '@/modules/permissions/infrastructure/interfaces/permission.server.repository.interface';
import { UserRepositoryInterface } from '@/modules/users/domain/interfaces/user.repository.interface';

describe('GetRoomByIdUseCase', () => {
  it('filters servers based on user permissions', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const permissionRepo: jest.Mocked<PermissionServerRepositoryInterface> = {
      findAllByField: jest.fn(),
      findPermissionByIds: jest.fn(),
      updatePermission: jest.fn(),
      deletePermission: jest.fn(),
      createPermission: jest.fn(),
      deleteByRoleAndServerIds: jest.fn(),
      findOneByField: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    } as any;
    const userRepo: jest.Mocked<UserRepositoryInterface> = {
      findOneByField: jest.fn(),
      findOneById: jest.fn(),
      updateFields: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    const useCase = new GetRoomByIdUseCase(
      roomRepository,
      permissionRepo,
      userRepo,
    );

    const server1 = createMockServer({ id: 's1' });
    const server2 = createMockServer({ id: 's2' });
    const room = mockRoom({ servers: [server1, server2] });
    const roomId = 'room-id';

    roomRepository.findRoomById.mockResolvedValue(room);
    userRepo.findOneByField.mockResolvedValue(
      createMockUser({ roles: [{ id: 'role-1' }] }),
    );
    permissionRepo.findAllByField.mockResolvedValue([
      createMockPermissionServer({
        roleId: 'role-1',
        serverId: 's1',
        bitmask: PermissionBit.READ,
      }),
    ]);

    const result = await useCase.execute(roomId, 'user-1');

    expect(roomRepository.findRoomById).toHaveBeenCalledWith(roomId);
    expect(permissionRepo.findAllByField).toHaveBeenCalled();
    expect(result.servers?.length).toBe(1);
    expect(result.servers?.[0].id).toBe('s1');
  });

  it('returns room with empty servers when no userId provided', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const permissionRepo: jest.Mocked<PermissionServerRepositoryInterface> = {
      findAllByField: jest.fn(),
      findPermissionByIds: jest.fn(),
      updatePermission: jest.fn(),
      deletePermission: jest.fn(),
      createPermission: jest.fn(),
      deleteByRoleAndServerIds: jest.fn(),
      findOneByField: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    } as any;
    const userRepo: jest.Mocked<UserRepositoryInterface> = {
      findOneByField: jest.fn(),
      findOneById: jest.fn(),
      updateFields: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    const useCase = new GetRoomByIdUseCase(
      roomRepository,
      permissionRepo,
      userRepo,
    );

    const server = createMockServer({ id: 's1' });
    const room = mockRoom({ servers: [server] });

    roomRepository.findRoomById.mockResolvedValue(room);

    const result = await useCase.execute(room.id);

    expect(roomRepository.findRoomById).toHaveBeenCalledWith(room.id);
    expect(result.servers).toEqual([]);
    expect(permissionRepo.findAllByField).not.toHaveBeenCalled();
  });

  it('returns room with empty servers when user has no role', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const permissionRepo: jest.Mocked<PermissionServerRepositoryInterface> = {
      findAllByField: jest.fn(),
      findPermissionByIds: jest.fn(),
      updatePermission: jest.fn(),
      deletePermission: jest.fn(),
      createPermission: jest.fn(),
      deleteByRoleAndServerIds: jest.fn(),
      findOneByField: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    } as any;
    const userRepo: jest.Mocked<UserRepositoryInterface> = {
      findOneByField: jest.fn(),
      findOneById: jest.fn(),
      updateFields: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    const useCase = new GetRoomByIdUseCase(
      roomRepository,
      permissionRepo,
      userRepo,
    );

    const room = mockRoom({ servers: [createMockServer({ id: 's1' })] });

    roomRepository.findRoomById.mockResolvedValue(room);
    userRepo.findOneByField.mockResolvedValue(createMockUser({ roles: [] }));

    const result = await useCase.execute(room.id, 'user-1');

    expect(roomRepository.findRoomById).toHaveBeenCalledWith(room.id);
    expect(permissionRepo.findAllByField).not.toHaveBeenCalled();
    expect(result.servers).toEqual([]);
  });

  it('returns all servers when user has global READ permission', async () => {
    const roomRepository =
      mockRoomRepository() as jest.Mocked<RoomRepositoryInterface>;
    const permissionRepo: jest.Mocked<PermissionServerRepositoryInterface> = {
      findAllByField: jest.fn(),
      findPermissionByIds: jest.fn(),
      updatePermission: jest.fn(),
      deletePermission: jest.fn(),
      createPermission: jest.fn(),
      deleteByRoleAndServerIds: jest.fn(),
      findOneByField: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    } as any;
    const userRepo: jest.Mocked<UserRepositoryInterface> = {
      findOneByField: jest.fn(),
      findOneById: jest.fn(),
      updateFields: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    } as any;

    const useCase = new GetRoomByIdUseCase(
      roomRepository,
      permissionRepo,
      userRepo,
    );

    const server1 = createMockServer({ id: 's1' });
    const server2 = createMockServer({ id: 's2' });
    const room = mockRoom({ servers: [server1, server2] });

    roomRepository.findRoomById.mockResolvedValue(room);
    userRepo.findOneByField.mockResolvedValue(
      createMockUser({ roles: [{ id: 'role-1' }] }),
    );
    permissionRepo.findAllByField.mockResolvedValue([
      createMockPermissionServer({
        roleId: 'role-1',
        serverId: null,
        bitmask: PermissionBit.READ,
      }),
    ]);

    const result = await useCase.execute(room.id, 'user-1');

    expect(result.servers?.length).toBe(2);
    expect(permissionRepo.findAllByField).toHaveBeenCalled();
  });
});
